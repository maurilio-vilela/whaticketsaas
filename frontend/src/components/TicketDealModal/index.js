import React, { useState, useEffect, useContext } from "react";
import * as Yup from "yup";
import { Formik, Field, FieldArray, Form } from "formik";
import { toast } from "react-toastify";
import { format, addDays } from "date-fns";
import NumberFormat from "react-number-format";

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Typography,
    IconButton,
    Divider,
    makeStyles,
    InputAdornment,
    Slider,
    Tooltip,
} from "@material-ui/core";

import { DeleteOutline, AddCircleOutline, MonetizationOn, TrendingUp, AcUnit, Whatshot } from "@material-ui/icons";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";

const useStyles = makeStyles((theme) => ({
    root: {
        display: "flex",
        flexWrap: "wrap",
    },
    dialogContent: {
        paddingTop: theme.spacing(2),
    },
    itemsContainer: {
        backgroundColor: theme.palette.background.default,
        padding: theme.spacing(2),
        borderRadius: 8,
        marginTop: theme.spacing(2),
        marginBottom: theme.spacing(2),
        border: "1px solid #eee",
    },
    itemRow: {
        display: "flex",
        alignItems: "center",
        marginBottom: theme.spacing(1),
        gap: theme.spacing(1),
    },
    totalContainer: {
        display: "flex",
        justifyContent: "flex-end",
        marginTop: theme.spacing(2),
        alignItems: "center",
    },
    totalLabel: {
        fontWeight: "bold",
        fontSize: "1.2rem",
        marginRight: theme.spacing(1),
    },
    totalValue: {
        fontWeight: "bold",
        fontSize: "1.2rem",
        color: theme.palette.success.main,
    },
    cold: { color: "#2196F3" },
    warm: { color: "#FF9800" },
    hot: { color: "#F44336" },
    temperatureSelected: {
        border: "2px solid",
        borderRadius: "50%",
        padding: 2,
    },
    dateShortcutContainer: {
        marginTop: theme.spacing(1),
        display: "flex",
        gap: theme.spacing(1),
    },
    dateShortcutBtn: {
        minWidth: "auto",
        padding: "2px 8px",
        fontSize: "0.75rem",
    },
}));

const DealSchema = Yup.object().shape({
    name: Yup.string().min(2, "Nome muito curto").required("Obrigatório"),
    contactId: Yup.number().required("Contato obrigatório"),
    status: Yup.string().required("Status obrigatório"),
    pipelineStageId: Yup.number().required("Selecione uma etapa do funil"),
    lossReason: Yup.string().when("status", {
        is: (val) => val === "lost" || val === "won",
        then: Yup.string().required("Por favor, justifique o fechamento."),
    }),
});

const TicketDealModal = ({ modalOpen, onClose, ticket, dealId }) => {
    const classes = useStyles();
    const { user } = useContext(AuthContext);

    const initialState = {
        name: "",
        contactId: ticket?.contactId || "",
        pipelineStageId: "",
        status: "open",
        temperature: "cold",
        probability: 50,
        expectedCloseDate: format(new Date(), "yyyy-MM-dd"),
        totalValue: 0,
        lossReason: "",
        notes: "",
        items: [{ name: "Serviço/Produto Inicial", quantity: 1, unitValue: 0 }],
    };

    const [deal, setDeal] = useState(initialState);
    const [stages, setStages] = useState([]);

    // --- CARREGAR TAGS VIA ROTA ESPECÍFICA KANBAN ---
    useEffect(() => {
        if (modalOpen) {
            const fetchTags = async () => {
                try {
                    // Usa a rota específica que criamos no backend
                    const { data } = await api.get("/tags/kanban");

                    // O backend retorna { lista: [...] }
                    const fetchedTags = data.lista || [];

                    setStages(fetchedTags);
                } catch (err) {
                    console.error("Erro ao buscar tags kanban:", err);
                    toastError(err);
                }
            };
            fetchTags();
        }
    }, [modalOpen]);

    useEffect(() => {
        const fetchDeal = async () => {
            if (!modalOpen) return;

            if (dealId) {
                try {
                    const { data } = await api.get(`/deals/${dealId}`);
                    setDeal({
                        ...data,
                        expectedCloseDate: data.expectedCloseDate
                            ? format(new Date(data.expectedCloseDate), "yyyy-MM-dd")
                            : "",
                        items: data.items && data.items.length > 0 ? data.items : initialState.items,
                    });
                } catch (err) {
                    toastError(err);
                }
            } else {
                setDeal((prev) => ({
                    ...initialState,
                    contactId: ticket?.contactId,
                    name: ticket?.contact?.name ? `Nova Venda: ${ticket.contact.name}` : "Nova Oportunidade",
                }));
            }
        };
        fetchDeal();
    }, [modalOpen, dealId, ticket]);

    const handleClose = () => {
        setDeal(initialState);
        onClose();
    };

    const handleSaveDeal = async (values) => {
        try {
            const totalValue = values.items.reduce((acc, item) => {
                return acc + Number(item.quantity) * Number(item.unitValue);
            }, 0);

            const dealData = {
                ...values,
                ticketId: ticket?.id,
                totalValue,
            };

            if (dealId) {
                await api.put(`/deals/${dealId}`, dealData);
            } else {
                await api.post("/deals", dealData);
            }

            toast.success("Oportunidade salva com sucesso!");
            handleClose();
        } catch (err) {
            toastError(err);
        }
    };

    const calculateTotal = (items) => {
        return items.reduce((acc, item) => {
            return acc + Number(item.quantity) * Number(item.unitValue);
        }, 0);
    };

    const handleAddDays = (days, currentVal, setFieldValue) => {
        let baseDate = new Date();
        if (currentVal) {
            const parts = currentVal.split("-");
            baseDate = new Date(parts[0], parts[1] - 1, parts[2]);
        }
        const newDate = addDays(baseDate, days);
        setFieldValue("expectedCloseDate", format(newDate, "yyyy-MM-dd"));
    };

    return (
        <Dialog open={modalOpen} onClose={handleClose} maxWidth="md" fullWidth scroll="paper">
            <DialogTitle>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <MonetizationOn color="primary" />
                    <Typography variant="h6">{dealId ? "Editar Oportunidade" : "Nova Oportunidade"}</Typography>
                </div>
            </DialogTitle>

            <Formik
                initialValues={deal}
                enableReinitialize={true}
                validationSchema={DealSchema}
                onSubmit={(values, actions) => {
                    setTimeout(() => {
                        handleSaveDeal(values);
                        actions.setSubmitting(false);
                    }, 400);
                }}
            >
                {({ values, errors, touched, isSubmitting, handleChange, setFieldValue }) => (
                    <Form>
                        <DialogContent dividers className={classes.dialogContent}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={8}>
                                    <Field
                                        as={TextField}
                                        label="Título da Oportunidade"
                                        name="name"
                                        error={touched.name && Boolean(errors.name)}
                                        helperText={touched.name && errors.name}
                                        variant="outlined"
                                        fullWidth
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <FormControl
                                        variant="outlined"
                                        fullWidth
                                        error={touched.pipelineStageId && Boolean(errors.pipelineStageId)}
                                    >
                                        <InputLabel>Etapa do Funil</InputLabel>
                                        <Field
                                            as={Select}
                                            label="Etapa do Funil"
                                            name="pipelineStageId"
                                            value={values.pipelineStageId}
                                            onChange={handleChange}
                                        >
                                            <MenuItem value="">
                                                <em>Selecione</em>
                                            </MenuItem>
                                            {stages.length > 0 ? (
                                                stages.map((stage) => (
                                                    <MenuItem key={stage.id} value={stage.id}>
                                                        <span
                                                            style={{
                                                                width: 10,
                                                                height: 10,
                                                                borderRadius: "50%",
                                                                backgroundColor: stage.color || "#ccc",
                                                                marginRight: 8,
                                                            }}
                                                        />
                                                        {stage.name}
                                                    </MenuItem>
                                                ))
                                            ) : (
                                                <MenuItem value="" disabled>
                                                    Nenhuma etapa configurada (Kanban)
                                                </MenuItem>
                                            )}
                                        </Field>
                                        {touched.pipelineStageId && errors.pipelineStageId && (
                                            <Typography variant="caption" color="error">
                                                {errors.pipelineStageId}
                                            </Typography>
                                        )}
                                    </FormControl>
                                </Grid>
                            </Grid>

                            <div className={classes.itemsContainer}>
                                <Typography
                                    variant="subtitle2"
                                    gutterBottom
                                    style={{ display: "flex", justifyContent: "space-between" }}
                                >
                                    <span>Itens da Oportunidade</span>
                                    <span style={{ fontSize: "0.8rem", color: "#666" }}>
                                        Adicione produtos ou serviços
                                    </span>
                                </Typography>

                                <Divider style={{ marginBottom: 16 }} />

                                <FieldArray name="items">
                                    {({ push, remove }) => (
                                        <>
                                            {values.items.map((item, index) => (
                                                <div key={index} className={classes.itemRow}>
                                                    <Grid container spacing={1} alignItems="center">
                                                        <Grid item xs={5}>
                                                            <Field
                                                                as={TextField}
                                                                label="Descrição do Item"
                                                                name={`items[${index}].name`}
                                                                variant="outlined"
                                                                size="small"
                                                                fullWidth
                                                            />
                                                        </Grid>
                                                        <Grid item xs={2}>
                                                            <Field
                                                                as={TextField}
                                                                label="Qtd"
                                                                name={`items[${index}].quantity`}
                                                                type="number"
                                                                variant="outlined"
                                                                size="small"
                                                                fullWidth
                                                                onChange={handleChange}
                                                            />
                                                        </Grid>
                                                        <Grid item xs={3}>
                                                            <Field name={`items[${index}].unitValue`}>
                                                                {({ field, form }) => (
                                                                    <NumberFormat
                                                                        customInput={TextField}
                                                                        label="Valor Unitário"
                                                                        variant="outlined"
                                                                        size="small"
                                                                        fullWidth
                                                                        value={field.value}
                                                                        onValueChange={(values) => {
                                                                            form.setFieldValue(
                                                                                `items[${index}].unitValue`,
                                                                                values.floatValue || 0
                                                                            );
                                                                        }}
                                                                        thousandSeparator="."
                                                                        decimalSeparator=","
                                                                        prefix="R$ "
                                                                        decimalScale={2}
                                                                        fixedDecimalScale
                                                                    />
                                                                )}
                                                            </Field>
                                                        </Grid>
                                                        <Grid item xs={2} style={{ textAlign: "center" }}>
                                                            <Typography variant="body2" style={{ fontWeight: "bold" }}>
                                                                R${" "}
                                                                {(
                                                                    values.items[index].quantity *
                                                                    values.items[index].unitValue
                                                                ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                                            </Typography>
                                                        </Grid>
                                                    </Grid>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => remove(index)}
                                                        color="secondary"
                                                    >
                                                        <DeleteOutline />
                                                    </IconButton>
                                                </div>
                                            ))}

                                            <Button
                                                startIcon={<AddCircleOutline />}
                                                onClick={() => push({ name: "", quantity: 1, unitValue: 0 })}
                                                color="primary"
                                                style={{ marginTop: 8 }}
                                            >
                                                Adicionar Item
                                            </Button>
                                        </>
                                    )}
                                </FieldArray>

                                <div className={classes.totalContainer}>
                                    <span className={classes.totalLabel}>Total da Oportunidade:</span>
                                    <span className={classes.totalValue}>
                                        R${" "}
                                        {calculateTotal(values.items).toLocaleString("pt-BR", {
                                            minimumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>
                            </div>

                            <Grid container spacing={2} alignItems="flex-start">
                                <Grid item xs={12} sm={4}>
                                    <Typography id="probability-slider" gutterBottom variant="caption">
                                        Probabilidade de Fechamento ({values.probability}%)
                                    </Typography>
                                    <Slider
                                        value={values.probability}
                                        onChange={(e, val) => setFieldValue("probability", val)}
                                        aria-labelledby="probability-slider"
                                        valueLabelDisplay="auto"
                                        step={10}
                                        marks
                                        min={0}
                                        max={100}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={4}>
                                    <Field
                                        as={TextField}
                                        label="Previsão de Fechamento"
                                        name="expectedCloseDate"
                                        type="date"
                                        variant="outlined"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                    />
                                    <div className={classes.dateShortcutContainer}>
                                        <Button
                                            variant="outlined"
                                            className={classes.dateShortcutBtn}
                                            onClick={() => handleAddDays(15, values.expectedCloseDate, setFieldValue)}
                                        >
                                            +15d
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            className={classes.dateShortcutBtn}
                                            onClick={() => handleAddDays(30, values.expectedCloseDate, setFieldValue)}
                                        >
                                            +30d
                                        </Button>
                                    </div>
                                </Grid>

                                <Grid item xs={12} sm={4}>
                                    <FormControl variant="outlined" fullWidth>
                                        <InputLabel>Status</InputLabel>
                                        <Field
                                            as={Select}
                                            label="Status"
                                            name="status"
                                            value={values.status}
                                            onChange={handleChange}
                                        >
                                            <MenuItem value="open">Em Aberto</MenuItem>
                                            <MenuItem value="won" style={{ color: "green" }}>
                                                Ganho (Venda Realizada)
                                            </MenuItem>
                                            <MenuItem value="lost" style={{ color: "red" }}>
                                                Perdido
                                            </MenuItem>
                                        </Field>
                                    </FormControl>
                                </Grid>
                            </Grid>

                            <div
                                style={{
                                    marginTop: 16,
                                    marginBottom: 16,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                }}
                            >
                                <Typography variant="body2">Temperatura do Negócio:</Typography>

                                <Tooltip title="Frio">
                                    <IconButton
                                        onClick={() => setFieldValue("temperature", "cold")}
                                        className={values.temperature === "cold" ? classes.temperatureSelected : ""}
                                    >
                                        <AcUnit className={classes.cold} />
                                    </IconButton>
                                </Tooltip>

                                <Tooltip title="Morno">
                                    <IconButton
                                        onClick={() => setFieldValue("temperature", "warm")}
                                        className={values.temperature === "warm" ? classes.temperatureSelected : ""}
                                    >
                                        <TrendingUp className={classes.warm} />
                                    </IconButton>
                                </Tooltip>

                                <Tooltip title="Quente">
                                    <IconButton
                                        onClick={() => setFieldValue("temperature", "hot")}
                                        className={values.temperature === "hot" ? classes.temperatureSelected : ""}
                                    >
                                        <Whatshot className={classes.hot} />
                                    </IconButton>
                                </Tooltip>
                            </div>

                            {(values.status === "won" || values.status === "lost") && (
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Field
                                            as={TextField}
                                            label={
                                                values.status === "won"
                                                    ? "Motivo do Sucesso (O que foi decisivo?)"
                                                    : "Motivo da Perda (Preço, Concorrência?)"
                                            }
                                            name="lossReason"
                                            multiline
                                            rows={2}
                                            variant="outlined"
                                            fullWidth
                                            required
                                            error={touched.lossReason && Boolean(errors.lossReason)}
                                            helperText={touched.lossReason && errors.lossReason}
                                        />
                                    </Grid>
                                </Grid>
                            )}

                            <Grid container spacing={2} style={{ marginTop: 8 }}>
                                <Grid item xs={12}>
                                    <Field
                                        as={TextField}
                                        label="Anotações Gerais / Informações Adicionais"
                                        name="notes"
                                        multiline
                                        rows={3}
                                        variant="outlined"
                                        fullWidth
                                    />
                                </Grid>
                            </Grid>
                        </DialogContent>

                        <DialogActions>
                            <Button color="primary" style={{ marginRight: "auto" }}>
                                Gerar Proposta (PDF)
                            </Button>

                            <Button onClick={handleClose} color="secondary" variant="outlined" disabled={isSubmitting}>
                                Cancelar
                            </Button>
                            <Button type="submit" color="primary" variant="contained" disabled={isSubmitting}>
                                {dealId ? "Atualizar Oportunidade" : "Salvar Oportunidade"}
                            </Button>
                        </DialogActions>
                    </Form>
                )}
            </Formik>
        </Dialog>
    );
};

export default TicketDealModal;
