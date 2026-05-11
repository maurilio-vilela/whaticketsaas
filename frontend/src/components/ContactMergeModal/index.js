import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    CircularProgress,
    FormControlLabel,
    Checkbox,
    Box,
    Paper,
} from "@material-ui/core";
import { MergeType } from "@material-ui/icons"; // Ícone ilustrativo
import Autocomplete from "@material-ui/lab/Autocomplete";
import { toast } from "react-toastify";
import api from "../../services/api";

const useStyles = makeStyles((theme) => ({
    root: {
        display: "flex",
        flexWrap: "wrap",
    },
    alertBox: {
        backgroundColor: "#fff4e5", // Laranja suave
        padding: "10px",
        borderRadius: "4px",
        marginTop: "15px",
        borderLeft: "4px solid #f57c00",
    },
}));

const ContactMergeModal = ({ open, onClose, contactId, contactName }) => {
    const classes = useStyles();
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState([]);
    const [targetContact, setTargetContact] = useState(null);
    const [searchParam, setSearchParam] = useState("");

    // Opção para manter o número
    const [keepNumber, setKeepNumber] = useState(true);

    useEffect(() => {
        if (!open || searchParam.length < 3) return;
        const delayDebounceFn = setTimeout(() => {
            const fetchContacts = async () => {
                try {
                    const { data } = await api.get("/contacts", { params: { searchParam } });
                    setOptions(data.contacts.filter((c) => c.id !== contactId));
                } catch (err) {
                    console.error(err);
                }
            };
            fetchContacts();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchParam, open, contactId]);

    const handleMerge = async () => {
        if (!targetContact) return;
        setLoading(true);
        try {
            console.log("Enviando requisição de merge:", { originId: contactId, targetId: targetContact.id }); // Log Front
            
            await api.post(`/contacts/merge`, { 
                originId: contactId, 
                targetId: targetContact.id,
                keepNumber: keepNumber
            });
            
            toast.success("Contatos unificados com sucesso!");
            
            setTimeout(() => {
                if (onClose) onClose();
                window.location.reload();
            }, 1000);
            
        } catch (err) {
            console.error("Erro detalhado no Frontend:", err.response?.data || err); // LOG DETALHADO AQUI
            const message = err?.response?.data?.message || err?.response?.data || err.message || "Erro ao unificar contatos";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Unificar Contatos</DialogTitle>
            <DialogContent>
                <Typography variant="body2" gutterBottom>
                    Selecione o contato principal. O contato atual <b>({contactName})</b> será fundido a ele.
                </Typography>

                <Autocomplete
                    style={{ marginTop: 10 }}
                    fullWidth
                    getOptionLabel={(option) => `${option.name} (${option.number})`}
                    options={options}
                    loading={loading}
                    onChange={(e, value) => setTargetContact(value)}
                    onInputChange={(e, v) => setSearchParam(v)}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Buscar Contato Destino (Principal)"
                            variant="outlined"
                            placeholder="Digite nome ou número"
                            required
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <React.Fragment>
                                        {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                    </React.Fragment>
                                ),
                            }}
                        />
                    )}
                />

                {targetContact && (
                    <Box className={classes.alertBox}>
                        <Typography variant="subtitle2" style={{ fontWeight: "bold", color: "#e65100" }}>
                            <MergeType style={{ fontSize: 16, verticalAlign: "middle", marginRight: 5 }} />
                            Ação Irreversível
                        </Typography>
                        <Typography variant="caption" display="block" style={{ marginTop: 5 }}>
                            1. Todos os tickets e históricos de <b>{contactName}</b> serão movidos para{" "}
                            <b>{targetContact.name}</b>.
                        </Typography>
                        <Typography variant="caption" display="block">
                            2. O contato <b>{contactName}</b> será excluído da lista principal.
                        </Typography>

                        <FormControlLabel
                            style={{ marginTop: 10 }}
                            control={
                                <Checkbox
                                    checked={keepNumber}
                                    onChange={(e) => setKeepNumber(e.target.checked)}
                                    name="keepNumber"
                                    color="primary"
                                />
                            }
                            label={
                                <Typography variant="body2">
                                    Salvar número antigo como <b>Secundário</b>?
                                    <br />
                                    <span style={{ fontSize: "0.75rem", color: "#666" }}>
                                        (Recomendado para casos de troca de chip/número)
                                    </span>
                                </Typography>
                            }
                        />
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="secondary">
                    Cancelar
                </Button>
                <Button onClick={handleMerge} color="primary" variant="contained" disabled={!targetContact || loading}>
                    {loading ? "Processando..." : "Confirmar Unificação"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ContactMergeModal;
