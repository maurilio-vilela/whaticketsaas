import React, { useState, useEffect, useRef, useContext } from "react";

import * as Yup from "yup";
import { Formik, FieldArray, Form, Field } from "formik";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import CircularProgress from "@material-ui/core/CircularProgress";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import { Tabs, Tab, Paper, Box, Grid, MenuItem, Select, InputLabel, FormControl, Divider } from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";
import { Person, Loyalty, Info, LocationOn } from "@material-ui/icons";

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";

const useStyles = makeStyles((theme) => ({
    root: {
        display: "flex",
        flexWrap: "wrap",
    },
    textField: {
        marginRight: theme.spacing(1),
        flex: 1,
    },
    extraAttr: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
    },
    btnWrapper: {
        position: "relative",
    },
    buttonProgress: {
        color: green[500],
        position: "absolute",
        top: "50%",
        left: "50%",
        marginTop: -12,
        marginLeft: -12,
    },
    tabContent: {
        padding: theme.spacing(2),
        minHeight: 400,
    },
    dialogTitle: {
        paddingBottom: 0,
    },
    sectionTitle: {
        fontWeight: "bold",
        marginTop: theme.spacing(2),
        marginBottom: theme.spacing(1),
        color: theme.palette.text.secondary,
    },
}));

const phoneRegExp =
    /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/;

const ContactSchema = Yup.object().shape({
    name: Yup.string().min(2, "Muito curto!").max(50, "Muito longo!").required("Obrigatório"),
    number: Yup.string().matches(phoneRegExp, "Número inválido").required("Obrigatório"),
    email: Yup.string().email("Email inválido"),
});

const ContactModal = ({ open, onClose, contactId, initialValues, onSave }) => {
    const classes = useStyles();
    const isMounted = useRef(true);
    const { user } = useContext(AuthContext);

    const initialState = {
        name: "",
        number: "",
        email: "",
        disableBot: false,
        extraInfo: [],
        tags: [],
        wallets: [],
        gender: "",
        personType: "F",
        cpf: "",
        cnpj: "",
        businessName: "",
        birthdayDate: "",
        state: "",
        city: "",
        address: "",
        reference: "",
    };

    const [contact, setContact] = useState(initialState);
    const [tabValue, setTabValue] = useState(0);
    const [tags, setTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState("");
    const [ticketUser, setTicketUser] = useState(null);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    // 1. Carregar Tags e Usuários (CORRIGIDO)
    useEffect(() => {
        const fetchResources = async () => {
            try {
                // --- BUSCA TAGS ---
                // Adicionado params para garantir que o backend entenda a requisição
                const { data } = await api.get("/tags", {
                    params: { searchParam: "", pageNumber: 1 },
                });

                // Correção Crítica: Verifica se veio array direto OU objeto paginado { tags: [], ... }
                const fetchedTags = Array.isArray(data) ? data : data.tags;
                setTags(fetchedTags || []);

                // --- BUSCA USUÁRIOS ---
                const { data: usersData } = await api.get("/users", {
                    params: { searchParam: "", pageNumber: 1 },
                });

                const fetchedUsers = Array.isArray(usersData) ? usersData : usersData.users;
                setUsers(fetchedUsers || []);
            } catch (error) {
                console.error("Erro ao carregar recursos:", error);
                setTags([]);
                setUsers([]);
            }
        };
        if (open) fetchResources();
    }, [open]);

    // 2. Carregar Contato e Popular Tags/Carteira
    useEffect(() => {
        const fetchContact = async () => {
            if (initialValues) {
                setContact((prevState) => ({ ...prevState, ...initialValues }));
            }

            if (!contactId) return;

            try {
                const { data } = await api.get(`/contacts/${contactId}`);
                if (isMounted.current) {
                    setContact(data);

                    // --- POPULAR TAGS (Combinado: Contato + Ticket) ---
                    const contactTags = data.tags || [];
                    const lastTicket = data.tickets && data.tickets.length > 0 ? data.tickets[0] : null;

                    let combinedTags = [...contactTags];

                    if (lastTicket && lastTicket.tags) {
                        lastTicket.tags.forEach((ticketTag) => {
                            // Evita duplicatas visualmente
                            if (!combinedTags.find((t) => t.id === ticketTag.id)) {
                                combinedTags.push(ticketTag);
                            }
                        });
                    }
                    setSelectedTags(combinedTags);

                    // --- POPULAR RESPONSÁVEL (Ticket) ---
                    if (lastTicket && lastTicket.user) {
                        setTicketUser(lastTicket.user);
                        setSelectedUser(String(lastTicket.user.id));
                    } else {
                        setTicketUser(null);
                        setSelectedUser("");
                    }
                }
            } catch (err) {
                toastError(err);
            }
        };

        fetchContact();
    }, [contactId, open, initialValues]);

    const handleClose = () => {
        onClose();
        setContact(initialState);
        setSelectedTags([]);
        setSelectedUser("");
        setTicketUser(null);
        setTabValue(0);
    };

    const handleSaveContact = async (values) => {
        try {
            const contactData = {
                ...values,
                // Envia os IDs das tags selecionadas (seja nova ou antiga)
                tags: selectedTags.map((t) => t.id),
            };

            if (contactId) {
                await api.put(`/contacts/${contactId}`, contactData);
                handleClose();
            } else {
                const { data } = await api.post("/contacts", contactData);
                if (onSave) {
                    onSave(data);
                }
                handleClose();
            }
            toast.success(i18n.t("contactModal.success"));
        } catch (err) {
            toastError(err);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    return (
        <div className={classes.root}>
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth scroll="paper">
                <DialogTitle id="form-dialog-title" className={classes.dialogTitle}>
                    {contactId ? `${i18n.t("contactModal.title.edit")}` : `${i18n.t("contactModal.title.add")}`}
                </DialogTitle>

                <Formik
                    initialValues={contact}
                    enableReinitialize={true}
                    validationSchema={ContactSchema}
                    onSubmit={(values, actions) => {
                        setTimeout(() => {
                            handleSaveContact(values);
                            actions.setSubmitting(false);
                        }, 400);
                    }}
                >
                    {({ values, errors, touched, isSubmitting, handleChange }) => (
                        <Form>
                            <DialogContent dividers style={{ padding: 0 }}>
                                <Paper square elevation={0}>
                                    <Tabs
                                        value={tabValue}
                                        onChange={handleTabChange}
                                        indicatorColor="primary"
                                        textColor="primary"
                                        variant="scrollable"
                                        scrollButtons="auto"
                                    >
                                        <Tab icon={<Person />} label="Dados Principais" />
                                        <Tab icon={<LocationOn />} label="Endereço" />
                                        <Tab icon={<Info />} label="Infos Adicionais" />
                                        <Tab icon={<Loyalty />} label="Segmentação" />
                                    </Tabs>
                                </Paper>

                                <div className={classes.tabContent}>
                                    {/* ABA 0: DADOS PRINCIPAIS */}
                                    {tabValue === 0 && (
                                        <Grid container spacing={2}>
                                            <Grid item xs={12}>
                                                <Typography variant="subtitle2" className={classes.sectionTitle}>
                                                    Dados do Contato
                                                </Typography>
                                                <Divider />
                                            </Grid>

                                            <Grid item xs={12} sm={6}>
                                                <Field
                                                    as={TextField}
                                                    label={i18n.t("contactModal.form.name")}
                                                    name="name"
                                                    autoFocus
                                                    error={touched.name && Boolean(errors.name)}
                                                    helperText={touched.name && errors.name}
                                                    variant="outlined"
                                                    fullWidth
                                                    required
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Field
                                                    as={TextField}
                                                    label={i18n.t("contactModal.form.number")}
                                                    name="number"
                                                    error={touched.number && Boolean(errors.number)}
                                                    helperText={
                                                        touched.number && errors.number
                                                            ? errors.number
                                                            : "Ex: 5511999998888"
                                                    }
                                                    variant="outlined"
                                                    fullWidth
                                                    required
                                                />
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Field
                                                    as={TextField}
                                                    label={i18n.t("contactModal.form.email")}
                                                    name="email"
                                                    error={touched.email && Boolean(errors.email)}
                                                    helperText={touched.email && errors.email}
                                                    variant="outlined"
                                                    fullWidth
                                                />
                                            </Grid>

                                            <Grid item xs={12} style={{ marginTop: 10 }}>
                                                <Typography variant="subtitle2" className={classes.sectionTitle}>
                                                    Dados Pessoais / Empresariais
                                                </Typography>
                                                <Divider />
                                            </Grid>

                                            <Grid item xs={12} sm={4}>
                                                <FormControl variant="outlined" fullWidth>
                                                    <InputLabel>Tipo de Pessoa</InputLabel>
                                                    <Select
                                                        value={values.personType}
                                                        onChange={handleChange}
                                                        name="personType"
                                                        label="Tipo de Pessoa"
                                                    >
                                                        <MenuItem value="F">Pessoa Física</MenuItem>
                                                        <MenuItem value="J">Pessoa Jurídica</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </Grid>

                                            {values.personType === "F" ? (
                                                <>
                                                    <Grid item xs={12} sm={4}>
                                                        <Field
                                                            as={TextField}
                                                            label="CPF"
                                                            name="cpf"
                                                            variant="outlined"
                                                            fullWidth
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} sm={4}>
                                                        <FormControl variant="outlined" fullWidth>
                                                            <InputLabel>Gênero</InputLabel>
                                                            <Select
                                                                value={values.gender || ""}
                                                                onChange={handleChange}
                                                                name="gender"
                                                                label="Gênero"
                                                            >
                                                                <MenuItem value="">
                                                                    <em>Selecione</em>
                                                                </MenuItem>
                                                                <MenuItem value="M">Masculino</MenuItem>
                                                                <MenuItem value="F">Feminino</MenuItem>
                                                                <MenuItem value="O">Outro</MenuItem>
                                                            </Select>
                                                        </FormControl>
                                                    </Grid>
                                                    <Grid item xs={12} sm={4}>
                                                        <Field
                                                            as={TextField}
                                                            label="Aniversário"
                                                            name="birthdayDate"
                                                            type="date"
                                                            variant="outlined"
                                                            fullWidth
                                                            InputLabelProps={{ shrink: true }}
                                                        />
                                                    </Grid>
                                                </>
                                            ) : (
                                                <>
                                                    <Grid item xs={12} sm={8}>
                                                        <Field
                                                            as={TextField}
                                                            label="Razão Social"
                                                            name="businessName"
                                                            variant="outlined"
                                                            fullWidth
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} sm={4}>
                                                        <Field
                                                            as={TextField}
                                                            label="CNPJ"
                                                            name="cnpj"
                                                            variant="outlined"
                                                            fullWidth
                                                        />
                                                    </Grid>
                                                </>
                                            )}
                                        </Grid>
                                    )}

                                    {/* ABA 1: LOCALIZAÇÃO */}
                                    {tabValue === 1 && (
                                        <Grid container spacing={2}>
                                            <Grid item xs={12}>
                                                <Typography variant="subtitle2" className={classes.sectionTitle}>
                                                    Localização
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={8}>
                                                <Field
                                                    as={TextField}
                                                    label="Rua / Endereço"
                                                    name="address"
                                                    variant="outlined"
                                                    fullWidth
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={4}>
                                                <Field
                                                    as={TextField}
                                                    label="Cidade"
                                                    name="city"
                                                    variant="outlined"
                                                    fullWidth
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={4}>
                                                <Field
                                                    as={TextField}
                                                    label="Estado (UF)"
                                                    name="state"
                                                    variant="outlined"
                                                    fullWidth
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={8}>
                                                <Field
                                                    as={TextField}
                                                    label="Ponto de Referência"
                                                    name="reference"
                                                    variant="outlined"
                                                    fullWidth
                                                />
                                            </Grid>
                                        </Grid>
                                    )}

                                    {/* ABA 2: EXTRAS */}
                                    {tabValue === 2 && (
                                        <>
                                            <Grid item xs={12}>
                                                <Typography variant="subtitle2" className={classes.sectionTitle}>
                                                    Informações Adicionais
                                                </Typography>
                                            </Grid>
                                            <FieldArray name="extraInfo">
                                                {({ push, remove }) => (
                                                    <>
                                                        {values.extraInfo &&
                                                            values.extraInfo.map((info, index) => (
                                                                <div
                                                                    className={classes.extraAttr}
                                                                    key={`${index}-info`}
                                                                >
                                                                    <Field
                                                                        as={TextField}
                                                                        label={i18n.t("contactModal.form.extraName")}
                                                                        name={`extraInfo[${index}].name`}
                                                                        variant="outlined"
                                                                        margin="dense"
                                                                        className={classes.textField}
                                                                    />
                                                                    <Field
                                                                        as={TextField}
                                                                        label={i18n.t("contactModal.form.extraValue")}
                                                                        name={`extraInfo[${index}].value`}
                                                                        variant="outlined"
                                                                        margin="dense"
                                                                        className={classes.textField}
                                                                    />
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => remove(index)}
                                                                    >
                                                                        <DeleteOutlineIcon />
                                                                    </IconButton>
                                                                </div>
                                                            ))}
                                                        <div className={classes.extraAttr}>
                                                            <Button
                                                                style={{ flex: 1, marginTop: 8 }}
                                                                variant="outlined"
                                                                color="primary"
                                                                onClick={() => push({ name: "", value: "" })}
                                                            >
                                                                {`+ ${i18n.t("contactModal.buttons.addExtraInfo")}`}
                                                            </Button>
                                                        </div>
                                                    </>
                                                )}
                                            </FieldArray>
                                        </>
                                    )}

                                    {/* ABA 3: SEGMENTAÇÃO */}
                                    {tabValue === 3 && (
                                        <Grid container spacing={2}>
                                            <Grid item xs={12}>
                                                <Typography variant="subtitle2" className={classes.sectionTitle}>
                                                    Etiquetas e Carteira
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Autocomplete
                                                    multiple
                                                    options={tags}
                                                    getOptionLabel={(option) => option.name}
                                                    value={selectedTags}
                                                    onChange={(e, v) => setSelectedTags(v || [])}
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            variant="outlined"
                                                            label="Etiquetas (Tags)"
                                                            placeholder="Selecionar Tags"
                                                        />
                                                    )}
                                                />
                                            </Grid>
                                            <Grid item xs={12}>
                                                <FormControl variant="outlined" fullWidth>
                                                    <InputLabel>Carteira (Responsável)</InputLabel>
                                                    <Select
                                                        key={selectedUser}
                                                        value={selectedUser}
                                                        onChange={(e) => setSelectedUser(e.target.value)}
                                                        label="Carteira (Responsável)"
                                                        // disabled={!!selectedUser}
                                                    >
                                                        <MenuItem value="">&nbsp;</MenuItem>

                                                        {users.map((user) => (
                                                            <MenuItem key={user.id} value={String(user.id)}>
                                                                {user.name}
                                                            </MenuItem>
                                                        ))}

                                                        {/* FALLBACK: Garante que o user do ticket apareça mesmo se não estiver na lista inicial */}
                                                        {ticketUser && !users.find((u) => u.id === ticketUser.id) && (
                                                            <MenuItem key={ticketUser.id} value={String(ticketUser.id)}>
                                                                {ticketUser.name} (Ticket)
                                                            </MenuItem>
                                                        )}
                                                    </Select>
                                                    {selectedUser && (
                                                        <Typography variant="caption" color="textSecondary">
                                                            * Responsável definido pelo último atendimento.
                                                        </Typography>
                                                    )}
                                                </FormControl>
                                            </Grid>

                                            <Grid item xs={12}>
                                                <Divider style={{ margin: "20px 0" }} />
                                                <Typography variant="subtitle2" className={classes.sectionTitle}>
                                                    Configurações Especiais
                                                </Typography>
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={values.disableBot}
                                                            onChange={() =>
                                                                setContact({
                                                                    ...values,
                                                                    disableBot: !values.disableBot,
                                                                })
                                                            }
                                                            name="disableBot"
                                                            color="primary"
                                                        />
                                                    }
                                                    label={i18n.t("contactModal.form.disableBot")}
                                                />
                                                <Typography variant="caption" color="textSecondary" display="block">
                                                    Ao desativar o bot, este contato não passará pelos fluxos
                                                    automáticos iniciais.
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    )}
                                </div>
                            </DialogContent>

                            <DialogActions>
                                <Button
                                    onClick={handleClose}
                                    color="secondary"
                                    disabled={isSubmitting}
                                    variant="outlined"
                                >
                                    {i18n.t("contactModal.buttons.cancel")}
                                </Button>
                                <Button
                                    type="submit"
                                    color="primary"
                                    disabled={isSubmitting}
                                    variant="contained"
                                    className={classes.btnWrapper}
                                >
                                    {contactId
                                        ? `${i18n.t("contactModal.buttons.okEdit")}`
                                        : `${i18n.t("contactModal.buttons.okAdd")}`}
                                    {isSubmitting && <CircularProgress size={24} className={classes.buttonProgress} />}
                                </Button>
                            </DialogActions>
                        </Form>
                    )}
                </Formik>
            </Dialog>
        </div>
    );
};

export default ContactModal;
