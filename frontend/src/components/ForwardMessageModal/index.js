import React, { useState, useEffect, useContext } from "react";
import { useHistory } from "react-router-dom";

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    CircularProgress,
    FormControlLabel,
    Switch,
    Typography,
    IconButton,
    Slide,
    makeStyles,
    Grid
} from "@material-ui/core";
import { Close as CloseIcon, Send as SendIcon } from "@material-ui/icons";
import Autocomplete, { createFilterOptions } from "@material-ui/lab/Autocomplete";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
import ContactModal from "../ContactModal";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";

const useStyles = makeStyles((theme) => ({
    dialogRoot: {
        '& .MuiDialog-paper': {
            borderRadius: 16,
            padding: 8,
        }
    },
    dialogHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px 8px',
    },
    dialogTitle: {
        fontWeight: 700,
        fontSize: '1.2rem',
        color: theme.palette.text.primary,
    },
    content: {
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
    },
    contactSelector: {
        width: '100%',
    },
    sendingFeedback: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        backgroundColor: theme.palette.mode === 'light' ? '#F3F4F6' : '#374151',
        padding: '10px 16px',
        borderRadius: 8,
        marginTop: 10,
    }
}));

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const ForwardMessageModal = ({ messages, onClose, modalOpen }) => {
    const classes = useStyles();
    const history = useHistory();
    const { user } = useContext(AuthContext);

    const [optionsContacts, setOptionsContacts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchParam, setSearchParam] = useState("");
    const [selectedContact, setSelectedContact] = useState(null);
    const [newContact, setNewContact] = useState({});
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [sending, setSending] = useState(false);
    const [messageSendingId, setMessageSendingId] = useState('');
    const [signMessage, setSignMessage] = useState(true);

    useEffect(() => {
        if (!modalOpen || searchParam.length < 3) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const delayDebounceFn = setTimeout(() => {
            const fetchContacts = async () => {
                try {
                    const { data } = await api.get("contacts", {
                        params: { searchParam },
                    });
                    setOptionsContacts(data.contacts);
                    setLoading(false);
                } catch (err) {
                    setLoading(false);
                    toastError(err);
                }
            };
            fetchContacts();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchParam, modalOpen]);

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const handleForwardMessage = async () => {
        if (!selectedContact) return;
        setSending(true);
        try {
            for (const message of messages) {
                setMessageSendingId(message.id);
                await api.post('/message/forward', {
                    messageId: message.id,
                    contactId: selectedContact.id,
                    signMessage: signMessage
                });
                await sleep(900); // Pausa para evitar bloqueio por spam
            }
            history.push('/tickets');
        } catch (error) {
            toastError(error);
        }
        setSending(false);
        handleClose();
    }

    const handleSelectOption = (e, newValue) => {
        if (newValue?.number) {
            setSelectedContact(newValue);
        } else if (newValue?.name) {
            setNewContact({ name: newValue.name });
            setContactModalOpen(true);
        }
    };

    const handleClose = () => {
        onClose();
        setSearchParam("");
        setSelectedContact(null);
        setSending(false);
    };

    const renderOption = option => {
        if (option.number) {
            return (
                <Grid container alignItems="center">
                    <Grid item xs>
                        {option.name}
                        <Typography variant="body2" color="textSecondary">
                            {option.number}
                        </Typography>
                    </Grid>
                </Grid>
            );
        }
        return `Adicionar "${option.name}"`;
    };

    const filter = createFilterOptions({ trim: true });

    const createAddContactOption = (filterOptions, params) => {
        const filtered = filter(filterOptions, params);
        if (params.inputValue !== "" && !loading && searchParam.length >= 3) {
            filtered.push({
                name: `${params.inputValue}`,
            });
        }
        return filtered;
    };

    return (
        <>
            <ContactModal
                open={contactModalOpen}
                initialValues={newContact}
                onClose={() => setContactModalOpen(false)}
            />
            <Dialog
                open={modalOpen}
                onClose={handleClose}
                TransitionComponent={Transition}
                maxWidth="sm"
                fullWidth
                className={classes.dialogRoot}
            >
                <div className={classes.dialogHeader}>
                    <Typography className={classes.dialogTitle}>
                        Encaminhar Mensagem
                    </Typography>
                    <IconButton onClick={handleClose} disabled={sending} size="small">
                        <CloseIcon />
                    </IconButton>
                </div>

                <DialogContent className={classes.content}>
                    <Typography variant="body2" color="textSecondary">
                        Selecione o contato para quem deseja encaminhar {messages?.length > 1 ? "as mensagens selecionadas" : "a mensagem selecionada"}.
                    </Typography>

                    <Autocomplete
                        options={optionsContacts}
                        loading={loading}
                        className={classes.contactSelector}
                        clearOnBlur
                        autoHighlight
                        freeSolo
                        clearOnEscape
                        getOptionLabel={option => option.name || ""}
                        renderOption={renderOption}
                        filterOptions={createAddContactOption}
                        onChange={handleSelectOption}
                        renderInput={params => (
                            <TextField
                                {...params}
                                label="Buscar Contato"
                                variant="outlined"
                                autoFocus
                                onChange={e => setSearchParam(e.target.value)}
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                }}
                            />
                        )}
                    />

                    {sending && (
                        <div className={classes.sendingFeedback}>
                            <CircularProgress size={20} color="primary" />
                            <Typography variant="body2">
                                Enviando mensagem {messageSendingId}...
                            </Typography>
                        </div>
                    )}
                </DialogContent>

                <DialogActions style={{ padding: '16px 24px' }}>
                    <FormControlLabel
                        control={
                            <Switch
                                size="small"
                                checked={signMessage}
                                onChange={(e) => setSignMessage(e.target.checked)}
                                color="primary"
                            />
                        }
                        label={
                            <Typography variant="body2" color="textSecondary">
                                {i18n.t("messagesInput.signMessage")}
                            </Typography>
                        }
                    />
                    <div style={{ flex: 1 }}></div>
                    <Button
                        onClick={handleClose}
                        disabled={sending}
                        color="secondary"
                    >
                        Cancelar
                    </Button>
                    <ButtonWithSpinner
                        variant="contained"
                        type="button"
                        disabled={!selectedContact || sending}
                        onClick={handleForwardMessage}
                        color="primary"
                        loading={sending}
                        startIcon={<SendIcon />}
                    >
                        Encaminhar
                    </ButtonWithSpinner>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ForwardMessageModal;