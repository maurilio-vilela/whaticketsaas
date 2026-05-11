import React, { useContext, useState } from "react";
import { useHistory } from "react-router-dom";

import { makeStyles, useTheme } from "@material-ui/core/styles";
import { IconButton, Tooltip, Box, Menu, MenuItem, ListItemIcon, ListItemText, useMediaQuery } from "@material-ui/core";

import {
    MoreVert,
    Replay,
    Undo,
    PlaylistAddCheck,
    MonetizationOn,
    Event,
    SwapHoriz,
    DeleteOutline,
    FolderShared, // Ícone GED
} from "@material-ui/icons";

import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";

// Importando os Modais
import TicketTaskModal from "../TicketTaskModal";
import TicketDealModal from "../TicketDealModal";
import TransferTicketModalCustom from "../TransferTicketModalCustom";
import ConfirmationModal from "../ConfirmationModal";
import ScheduleModal from "../ScheduleModal";
import TicketGedModal from "../TicketGedModal";

const useStyles = makeStyles((theme) => ({
    actionButtons: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(0.5),
        flex: "none",
    },
    // Cores Semânticas para Desktop
    successButton: {
        color: theme.palette.success.main,
        "&:hover": { backgroundColor: theme.palette.success.light + "20" },
    },
    warningButton: {
        color: "#F59E0B",
        "&:hover": { backgroundColor: "#F59E0B20" },
    },
    dangerButton: {
        color: theme.palette.error.main,
        "&:hover": { backgroundColor: theme.palette.error.light + "20" },
    },
    infoButton: {
        color: theme.palette.primary.main,
    },
    defaultIcon: {
        color: theme.palette.action.active,
    },
    // Estilos para ícones dentro do Menu (Mobile)
    menuIcon: {
        minWidth: "35px",
    },
}));

const TicketActionButtonsCustom = ({ ticket }) => {
    const classes = useStyles();
    const history = useHistory();
    const theme = useTheme();

    // Detecta se é mobile (xs = extra small screens)
    const isMobile = useMediaQuery(theme.breakpoints.down("xs"));

    const [anchorEl, setAnchorEl] = useState(null);
    const [loading, setLoading] = useState(false);

    // Estados para os Modais
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [dealModalOpen, setDealModalOpen] = useState(false);
    const [transferModalOpen, setTransferModalOpen] = useState(false);
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [confirmationOpen, setConfirmationOpen] = useState(false);
    const [gedModalOpen, setGedModalOpen] = useState(false); // Estado para o GED

    const { user } = useContext(AuthContext);
    const { setCurrentTicket } = useContext(TicketsContext);

    // Menu Responsivo
    const handleOpenMenu = (e) => {
        setAnchorEl(e.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    // --- AÇÃO: ATUALIZAR STATUS ---
    const handleUpdateTicketStatus = async (e, status, userId) => {
        setLoading(true);
        try {
            await api.put(`/tickets/${ticket.id}`, {
                status: status,
                userId: userId || null,
                useIntegration: status === "closed" ? false : ticket.useIntegration,
                promptId: status === "closed" ? false : ticket.promptId,
                integrationId: status === "closed" ? false : ticket.integrationId,
            });

            setLoading(false);
            if (status === "open") {
                setCurrentTicket({ ...ticket, code: "#open" });
            } else {
                setCurrentTicket({ id: null, code: null });
                history.push("/tickets");
            }
        } catch (err) {
            setLoading(false);
            toastError(err);
        }
    };

    // --- AÇÃO: DELETAR TICKET ---
    const handleDeleteTicket = async () => {
        setLoading(true);
        try {
            await api.delete(`/tickets/${ticket.id}`);
            setLoading(false);
            setCurrentTicket({ id: null, code: null });
            history.push("/tickets");
        } catch (err) {
            setLoading(false);
            toastError(err);
        }
    };

    return (
        <Box className={classes.actionButtons}>
            {/* === MODAIS === */}
            <TicketTaskModal modalOpen={taskModalOpen} onClose={() => setTaskModalOpen(false)} ticket={ticket} />
            <TicketDealModal modalOpen={dealModalOpen} onClose={() => setDealModalOpen(false)} ticket={ticket} />

            {/* Modal GED Renderizado aqui */}
            <TicketGedModal open={gedModalOpen} onClose={() => setGedModalOpen(false)} ticket={ticket} />

            <TransferTicketModalCustom
                modalOpen={transferModalOpen}
                onClose={() => setTransferModalOpen(false)}
                ticketid={ticket.id}
            />
            <ScheduleModal
                open={scheduleModalOpen}
                onClose={() => setScheduleModalOpen(false)}
                aria-labelledby="form-dialog-title"
                contactId={ticket.contactId}
            />
            <ConfirmationModal
                title={`${i18n.t("ticketOptionsMenu.confirmationModal.title")} #${ticket.id} ${i18n.t("ticketOptionsMenu.confirmationModal.titleFrom")} ${user.name}?`}
                open={confirmationOpen}
                onClose={() => setConfirmationOpen(false)}
                onConfirm={handleDeleteTicket}
            >
                {i18n.t("ticketOptionsMenu.confirmationModal.message")}
            </ConfirmationModal>

            {/* === TICKET FECHADO === */}
            {ticket.status === "closed" && (
                <ButtonWithSpinner
                    loading={loading}
                    startIcon={<Replay />}
                    size="small"
                    onClick={(e) => handleUpdateTicketStatus(e, "open", user?.id)}
                >
                    {i18n.t("messagesList.header.buttons.reopen")}
                </ButtonWithSpinner>
            )}

            {/* === TICKET ABERTO === */}
            {ticket.status === "open" && (
                <>
                    {/* BOTÕES DE FLUXO PRINCIPAL (Sempre visíveis: Mobile e Desktop) */}
                    <Tooltip title={i18n.t("messagesList.header.buttons.return")}>
                        <IconButton
                            onClick={(e) => handleUpdateTicketStatus(e, "pending", null)}
                            className={classes.defaultIcon}
                        >
                            <Undo />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title={i18n.t("messagesList.header.buttons.resolve")}>
                        <IconButton
                            onClick={(e) => handleUpdateTicketStatus(e, "closed", user?.id)}
                            className={classes.defaultIcon}
                        >
                            <CancelOutlinedIcon />
                        </IconButton>
                    </Tooltip>

                    {/* LÓGICA RESPONSIVA: DESKTOP vs MOBILE */}
                    {!isMobile ? (
                        <>
                            {/* --- VERSÃO DESKTOP (Botões visíveis) --- */}
                            <Tooltip title="Nova Tarefa">
                                <IconButton onClick={() => setTaskModalOpen(true)} className={classes.defaultIcon}>
                                    <PlaylistAddCheck />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Criar Oportunidade">
                                <IconButton onClick={() => setDealModalOpen(true)} className={classes.defaultIcon}>
                                    <MonetizationOn />
                                </IconButton>
                            </Tooltip>

                            {/* Botão GED Desktop */}
                            <Tooltip title="Arquivos do Ticket (GED)">
                                <IconButton onClick={() => setGedModalOpen(true)} className={classes.defaultIcon}>
                                    <FolderShared />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title={i18n.t("ticketOptionsMenu.schedule")}>
                                <IconButton onClick={() => setScheduleModalOpen(true)} className={classes.defaultIcon}>
                                    <Event />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title={i18n.t("ticketOptionsMenu.transfer")}>
                                <IconButton onClick={() => setTransferModalOpen(true)} className={classes.defaultIcon}>
                                    <SwapHoriz />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title={i18n.t("ticketOptionsMenu.delete")}>
                                <IconButton onClick={() => setConfirmationOpen(true)} className={classes.dangerButton}>
                                    <DeleteOutline />
                                </IconButton>
                            </Tooltip>
                        </>
                    ) : (
                        <>
                            {/* --- VERSÃO MOBILE (Menu de 3 Pontos) --- */}
                            <IconButton onClick={handleOpenMenu}>
                                <MoreVert />
                            </IconButton>
                            <Menu anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleCloseMenu}>
                                <MenuItem
                                    onClick={() => {
                                        handleCloseMenu();
                                        setTaskModalOpen(true);
                                    }}
                                >
                                    <ListItemIcon className={classes.menuIcon}>
                                        <PlaylistAddCheck fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary="Nova Tarefa" />
                                </MenuItem>
                                <MenuItem
                                    onClick={() => {
                                        handleCloseMenu();
                                        setDealModalOpen(true);
                                    }}
                                >
                                    <ListItemIcon className={classes.menuIcon}>
                                        <MonetizationOn fontSize="small" style={{ color: "#F59E0B" }} />
                                    </ListItemIcon>
                                    <ListItemText primary="Criar Oportunidade" />
                                </MenuItem>

                                {/* Item GED Mobile */}
                                <MenuItem
                                    onClick={() => {
                                        handleCloseMenu();
                                        setGedModalOpen(true);
                                    }}
                                >
                                    <ListItemIcon className={classes.menuIcon}>
                                        <FolderShared fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary="Arquivos (GED)" />
                                </MenuItem>

                                <MenuItem
                                    onClick={() => {
                                        handleCloseMenu();
                                        setScheduleModalOpen(true);
                                    }}
                                >
                                    <ListItemIcon className={classes.menuIcon}>
                                        <Event fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary={i18n.t("ticketOptionsMenu.schedule")} />
                                </MenuItem>
                                <MenuItem
                                    onClick={() => {
                                        handleCloseMenu();
                                        setTransferModalOpen(true);
                                    }}
                                >
                                    <ListItemIcon className={classes.menuIcon}>
                                        <SwapHoriz fontSize="small" color="primary" />
                                    </ListItemIcon>
                                    <ListItemText primary={i18n.t("ticketOptionsMenu.transfer")} />
                                </MenuItem>
                                <MenuItem
                                    onClick={() => {
                                        handleCloseMenu();
                                        setConfirmationOpen(true);
                                    }}
                                >
                                    <ListItemIcon className={classes.menuIcon}>
                                        <DeleteOutline fontSize="small" color="error" />
                                    </ListItemIcon>
                                    <ListItemText primary={i18n.t("ticketOptionsMenu.delete")} />
                                </MenuItem>
                            </Menu>
                        </>
                    )}
                </>
            )}

            {/* === TICKET PENDENTE === */}
            {ticket.status === "pending" && (
                <ButtonWithSpinner
                    loading={loading}
                    size="small"
                    variant="contained"
                    color="primary"
                    onClick={(e) => handleUpdateTicketStatus(e, "open", user?.id)}
                >
                    {i18n.t("messagesList.header.buttons.accept")}
                </ButtonWithSpinner>
            )}
        </Box>
    );
};

export default TicketActionButtonsCustom;
