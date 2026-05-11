import React, { useContext, useState } from "react";
import { useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import { IconButton, Tooltip, Box } from "@material-ui/core";
import { MoreVert, Replay, Check, PlaylistAddCheck, MonetizationOn } from "@material-ui/icons";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import TicketOptionsMenu from "../TicketOptionsMenu";
import ButtonWithSpinner from "../ButtonWithSpinner";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";

// Importando os novos modais
import TicketTaskModal from "../TicketTaskModal";
import TicketDealModal from "../TicketDealModal";

const useStyles = makeStyles((theme) => ({
    actionButtons: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(1),
        flex: "none",
        [theme.breakpoints.down("xs")]: {
            width: "100%",
            justifyContent: "flex-end",
        },
    },
    dealButton: {
        color: "#F59E0B", // Dourado/Âmbar para oportunidade
    },
}));

const TicketActionButtons = ({ ticket }) => {
    const classes = useStyles();
    const history = useHistory();
    const [anchorEl, setAnchorEl] = useState(null);
    const [loading, setLoading] = useState(false);

    // Estados para os Modais
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [dealModalOpen, setDealModalOpen] = useState(false);

    const ticketOptionsMenuOpen = Boolean(anchorEl);
    const { user } = useContext(AuthContext);

    const handleOpenTicketOptionsMenu = (e) => {
        setAnchorEl(e.currentTarget);
    };

    const handleCloseTicketOptionsMenu = (e) => {
        setAnchorEl(null);
    };

    const handleUpdateTicketStatus = async (e, status, userId) => {
        setLoading(true);
        try {
            await api.put(`/tickets/${ticket.id}`, {
                status: status,
                userId: userId || null,
            });

            setLoading(false);
            if (status === "open") {
                history.push(`/tickets/${ticket.id}`);
            } else {
                history.push("/tickets");
            }
        } catch (err) {
            setLoading(false);
            toastError(err);
        }
    };

    return (
        <Box className={classes.actionButtons}>
            {/* NOVOS MODAIS */}
            <TicketTaskModal modalOpen={taskModalOpen} onClose={() => setTaskModalOpen(false)} ticket={ticket} />
            <TicketDealModal modalOpen={dealModalOpen} onClose={() => setDealModalOpen(false)} ticket={ticket} />

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

            {ticket.status === "open" && (
                <>
                    {/* NOVOS BOTÕES */}
                    <Tooltip title="Nova Tarefa">
                        <IconButton onClick={() => setTaskModalOpen(true)}>
                            <PlaylistAddCheck />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Criar Oportunidade">
                        <IconButton onClick={() => setDealModalOpen(true)} className={classes.dealButton}>
                            <MonetizationOn />
                        </IconButton>
                    </Tooltip>

                    {/* BOTÕES PADRÃO */}
                    <Tooltip title={i18n.t("messagesList.header.buttons.return")}>
                        <IconButton onClick={(e) => handleUpdateTicketStatus(e, "pending", null)}>
                            <Replay />
                        </IconButton>
                    </Tooltip>

                    <ButtonWithSpinner
                        loading={loading}
                        startIcon={<Check />}
                        size="small"
                        variant="contained"
                        color="primary"
                        onClick={(e) => handleUpdateTicketStatus(e, "closed", user?.id)}
                    >
                        {i18n.t("messagesList.header.buttons.resolve")}
                    </ButtonWithSpinner>

                    <IconButton onClick={handleOpenTicketOptionsMenu}>
                        <MoreVert />
                    </IconButton>
                    <TicketOptionsMenu
                        ticket={ticket}
                        anchorEl={anchorEl}
                        menuOpen={ticketOptionsMenuOpen}
                        handleClose={handleCloseTicketOptionsMenu}
                    />
                </>
            )}

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

export default TicketActionButtons;
