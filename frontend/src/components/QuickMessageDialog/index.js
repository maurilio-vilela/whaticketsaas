import React, { useContext, useState, useEffect, useRef } from "react";
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";
import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import CircularProgress from "@material-ui/core/CircularProgress";
import { AttachFile, DeleteOutline, Description, Image, Audiotrack } from "@material-ui/icons";
import IconButton from "@material-ui/core/IconButton";
import { i18n } from "../../translate/i18n";
import { head } from "lodash";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import MessageVariablesPicker from "../MessageVariablesPicker";
import ConfirmationModal from "../ConfirmationModal";
import { FormControl, Grid, InputLabel, MenuItem, Select, Typography, Box } from "@material-ui/core";
import path from "path-browserify";

const useStyles = makeStyles((theme) => ({
    root: {
        display: "flex",
        flexWrap: "wrap",
    },
    multFieldLine: {
        display: "flex",
        "& > *:not(:last-child)": {
            marginRight: theme.spacing(1),
        },
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
    attachmentBox: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: theme.spacing(1),
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.spacing(1),
        marginTop: theme.spacing(1),
        backgroundColor: theme.palette.action.hover,
    },
}));

const QuickeMessageSchema = Yup.object().shape({
    shortcode: Yup.string().required("Obrigatório"),
    message: Yup.string().nullable(),
});

const QuickMessageDialog = ({ open, onClose, quickemessageId, reload }) => {
    const classes = useStyles();
    const { user } = useContext(AuthContext);
    const { profile } = user;
    const messageInputRef = useRef();

    const initialState = {
        shortcode: "",
        message: "",
        geral: false,
        status: true,
        mediaPath: null,
        mediaName: null,
    };

    const [confirmationOpen, setConfirmationOpen] = useState(false);
    const [quickemessage, setQuickemessage] = useState(initialState);
    const [attachment, setAttachment] = useState(null);
    const attachmentFile = useRef(null);

    useEffect(() => {
        try {
            (async () => {
                if (!quickemessageId) return;
                const { data } = await api.get(`/quick-messages/${quickemessageId}`);
                setQuickemessage((prevState) => {
                    return { ...prevState, ...data };
                });
            })();
        } catch (err) {
            toastError(err);
        }
    }, [quickemessageId, open]);

    const handleClose = () => {
        setQuickemessage(initialState);
        setAttachment(null);
        onClose();
    };

    const handleAttachmentFile = (e) => {
        const file = head(e.target.files);
        if (file) {
            setAttachment(file);
        }
    };

    const handleSaveQuickeMessage = async (values) => {
        const quickemessageData = {
            ...values,
            isMedia: true,
            mediaPath: attachment
                ? String(attachment.name).replace(/ /g, "_")
                : values.mediaPath
                  ? path.basename(values.mediaPath).replace(/ /g, "_")
                  : null,
        };

        try {
            if (quickemessageId) {
                await api.put(`/quick-messages/${quickemessageId}`, quickemessageData);
                if (attachment != null) {
                    const formData = new FormData();
                    formData.append("typeArch", "quickMessage");
                    formData.append("file", attachment);
                    await api.post(`/quick-messages/${quickemessageId}/media-upload`, formData);
                }
            } else {
                const { data } = await api.post("/quick-messages", quickemessageData);
                if (attachment != null) {
                    const formData = new FormData();
                    formData.append("typeArch", "quickMessage");
                    formData.append("file", attachment);
                    await api.post(`/quick-messages/${data.id}/media-upload`, formData);
                }
            }
            toast.success(i18n.t("quickMessages.toasts.success"));
            if (typeof reload == "function") {
                reload();
            }
        } catch (err) {
            toastError(err);
        }
        handleClose();
    };

    const deleteMedia = async () => {
        if (attachment) {
            setAttachment(null);
            attachmentFile.current.value = null;
        }

        if (quickemessage.mediaPath) {
            await api.delete(`/quick-messages/${quickemessage.id}/media-upload`);
            setQuickemessage((prev) => ({
                ...prev,
                mediaPath: null,
                mediaName: null,
            }));
            toast.success(i18n.t("quickMessages.toasts.deleted"));
            if (typeof reload == "function") {
                reload();
            }
        }
        setConfirmationOpen(false);
    };

    const handleClickMsgVar = async (msgVar, setValueFunc) => {
        const el = messageInputRef.current;
        const firstHalfText = el.value.substring(0, el.selectionStart);
        const secondHalfText = el.value.substring(el.selectionEnd);
        const newCursorPos = el.selectionStart + msgVar.length;

        setValueFunc("message", `${firstHalfText}${msgVar}${secondHalfText}`);

        await new Promise((r) => setTimeout(r, 100));
        messageInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
    };

    const renderAttachmentIcon = (name) => {
        if (!name) return <AttachFile />;
        const ext = name.split(".").pop().toLowerCase();
        if (["jpg", "jpeg", "png", "gif"].includes(ext)) return <Image />;
        if (["mp3", "wav", "ogg"].includes(ext)) return <Audiotrack />;
        return <Description />;
    };

    return (
        <div className={classes.root}>
            <ConfirmationModal
                title={i18n.t("quickMessages.confirmationModal.deleteTitle")}
                open={confirmationOpen}
                onClose={() => setConfirmationOpen(false)}
                onConfirm={deleteMedia}
            >
                {i18n.t("quickMessages.confirmationModal.deleteMessage")}
            </ConfirmationModal>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth scroll="paper">
                <DialogTitle id="form-dialog-title">
                    {quickemessageId
                        ? `${i18n.t("quickMessages.dialog.edit")}`
                        : `${i18n.t("quickMessages.dialog.add")}`}
                </DialogTitle>

                <div style={{ display: "none" }}>
                    <input type="file" ref={attachmentFile} onChange={(e) => handleAttachmentFile(e)} />
                </div>

                <Formik
                    initialValues={quickemessage}
                    enableReinitialize={true}
                    validationSchema={QuickeMessageSchema}
                    onSubmit={(values, actions) => {
                        setTimeout(() => {
                            handleSaveQuickeMessage(values);
                            actions.setSubmitting(false);
                        }, 400);
                    }}
                >
                    {({ touched, errors, isSubmitting, setFieldValue, values }) => (
                        <Form>
                            <DialogContent dividers>
                                <Grid spacing={2} container>
                                    <Grid xs={12} item>
                                        <Field
                                            as={TextField}
                                            autoFocus
                                            label={i18n.t("quickMessages.dialog.shortcode")}
                                            name="shortcode"
                                            error={touched.shortcode && Boolean(errors.shortcode)}
                                            helperText={touched.shortcode && errors.shortcode}
                                            variant="outlined"
                                            margin="dense"
                                            fullWidth
                                        />
                                    </Grid>

                                    {profile === "admin" && (
                                        <Grid xs={12} item>
                                            <FormControl variant="outlined" margin="dense" fullWidth>
                                                <InputLabel id="geral-selection-label">
                                                    {i18n.t("quickMessages.dialog.geral")}
                                                </InputLabel>
                                                <Field
                                                    as={Select}
                                                    label={i18n.t("quickMessages.dialog.geral")}
                                                    placeholder={i18n.t("quickMessages.dialog.geral")}
                                                    labelId="geral-selection-label"
                                                    id="geral"
                                                    name="geral"
                                                    error={touched.geral && Boolean(errors.geral)}
                                                >
                                                    <MenuItem value={true}>Ativo</MenuItem>
                                                    <MenuItem value={false}>Inativo</MenuItem>
                                                </Field>
                                            </FormControl>
                                        </Grid>
                                    )}

                                    <Grid xs={12} item>
                                        <Field
                                            as={TextField}
                                            label={i18n.t("quickMessages.dialog.message")}
                                            name="message"
                                            inputRef={messageInputRef}
                                            error={touched.message && Boolean(errors.message)}
                                            helperText={touched.message && errors.message}
                                            variant="outlined"
                                            margin="dense"
                                            multiline={true}
                                            rows={7}
                                            fullWidth
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <MessageVariablesPicker
                                            disabled={isSubmitting}
                                            onClick={(value) => handleClickMsgVar(value, setFieldValue)}
                                        />
                                    </Grid>

                                    {/* ÁREA DE ANEXO MODERNIZADA */}
                                    <Grid item xs={12}>
                                        {quickemessage.mediaPath || attachment ? (
                                            <Box className={classes.attachmentBox}>
                                                <div style={{ display: "flex", alignItems: "center" }}>
                                                    {renderAttachmentIcon(
                                                        attachment ? attachment.name : quickemessage.mediaPath
                                                    )}
                                                    <Typography
                                                        variant="body2"
                                                        style={{ marginLeft: 8, fontWeight: "bold" }}
                                                    >
                                                        {attachment ? attachment.name : quickemessage.mediaName}
                                                    </Typography>
                                                </div>
                                                <IconButton onClick={() => setConfirmationOpen(true)} size="small">
                                                    <DeleteOutline color="secondary" />
                                                </IconButton>
                                            </Box>
                                        ) : (
                                            <Button
                                                startIcon={<AttachFile />}
                                                fullWidth
                                                variant="outlined"
                                                color="primary"
                                                onClick={() => attachmentFile.current.click()}
                                                disabled={isSubmitting}
                                                style={{ marginTop: 8, borderStyle: "dashed" }}
                                            >
                                                {i18n.t("quickMessages.buttons.attach")}
                                            </Button>
                                        )}
                                    </Grid>
                                </Grid>
                            </DialogContent>
                            <DialogActions>
                                <Button
                                    onClick={handleClose}
                                    color="secondary"
                                    disabled={isSubmitting}
                                    variant="outlined"
                                >
                                    {i18n.t("quickMessages.buttons.cancel")}
                                </Button>
                                <Button
                                    type="submit"
                                    color="primary"
                                    disabled={isSubmitting}
                                    variant="contained"
                                    className={classes.btnWrapper}
                                >
                                    {quickemessageId
                                        ? `${i18n.t("quickMessages.buttons.edit")}`
                                        : `${i18n.t("quickMessages.buttons.add")}`}
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

export default QuickMessageDialog;
