import { IconButton, makeStyles, Tooltip, Badge, Avatar } from "@material-ui/core";
import React, { useState } from "react";
import { BookOpen, Calendar, MessageSquare } from "react-feather";
import { PlaylistAddCheck, LocalOffer, Person } from "@material-ui/icons"; // Ícone de Tag e Pessoa

import ScheduleModal from "../../ScheduleModal";
import ContactNotesDialog from "../../ContactNotesDialog";
import TicketTaskModal from "../../TicketTaskModal";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { Typography } from "@mui/material";

const useStyles = makeStyles((theme) => ({
    container: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between", // ESQUERDA (User) <-> DIREITA (Botoes)
        marginTop: "8px",
        paddingTop: "6px",
        borderTop: `1px solid ${theme.palette.divider}`,
        minHeight: "32px",
    },
    // Grupo de Botões da Direita
    rightButtons: {
        display: "flex",
        alignItems: "center",
        gap: "2px",
    },
    iconBtn: {
        padding: "6px",
        borderRadius: "6px",
        color: theme.palette.text.secondary,
        "&:hover": {
            backgroundColor: theme.palette.action.hover,
            color: theme.palette.text.primary,
        },
    },
    chatBtn: {
        padding: "6px",
        borderRadius: "6px",
        color: "#fff",
        backgroundColor: theme.palette.primary.main,
        marginLeft: "4px",
        "&:hover": {
            backgroundColor: theme.palette.primary.dark,
        },
    },
    // Estilo do Avatar do Usuário (Esquerda)
    userAvatar: {
        width: "24px",
        height: "24px",
        fontSize: "12px",
        backgroundColor: theme.palette.grey[300],
        color: theme.palette.grey[700],
        border: `1px solid ${theme.palette.background.paper}`,
    },
    userName: {
        marginLeft: "6px",
        fontSize: "12px",
        color: theme.palette.text.primary,
        maxWidth: "80px",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    // Badge da Tag
    tagBadge: {
        "& .MuiBadge-badge": {
            right: 2,
            top: 2,
            fontSize: "9px",
            height: "14px",
            minWidth: "14px",
            padding: "0 2px",
        },
    },
}));

export default function FooterButtons({ ticket }) {
    const classes = useStyles();
    const history = useHistory();

    // Estados dos Modais
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [contactNotesModal, setContactNotesModal] = useState(false);
    const [taskModalOpen, setTaskModalOpen] = useState(false);

    // Dados do Ticket
    const tags = ticket.tags || [];
    const user = ticket.user;

    // Tooltip das Tags
    const tagsTooltipText = tags.length > 0 ? tags.map((t) => t.name).join(", ") : "Sem etiquetas";

    const handleSelectTicket = (e) => {
        e.preventDefault();
        history.push(`/tickets/${ticket.uuid}`);
    };

    return (
        <>
            <ContactNotesDialog
                modalOpen={contactNotesModal}
                onClose={() => setContactNotesModal(false)}
                ticket={ticket}
            />
            <ScheduleModal
                open={scheduleModalOpen}
                onClose={() => setScheduleModalOpen(false)}
                contactId={ticket.contact.id}
            />
            <TicketTaskModal modalOpen={taskModalOpen} onClose={() => setTaskModalOpen(false)} ticket={ticket} />

            <div className={classes.container}>
                {/* LADO ESQUERDO: Responsável */}
                <div>
                    {user && (
                        <Tooltip title={`Responsável: ${user.name}`}>
                            {/* O SEGREDO É ESTA DIV ENVOLVENDO TUDO */}
                            <div style={{ display: 'flex', alignItems: 'center', cursor: 'default' }}>
                                <Avatar 
                                    src={user.profileImage} 
                                    className={classes.userAvatar}
                                    alt={user.name}
                                >
                                    {!user.profileImage && <Person style={{fontSize: 14}} />}
                                </Avatar>
                                
                                {/* Se quiser exibir o nome visualmente também */}
                                <Typography className={classes.userName} variant="caption" style={{ marginLeft: 6, fontWeight: 500 }}>
                                    {user.name}
                                </Typography>
                            </div>
                        </Tooltip>
                    )}
                </div>

                {/* LADO DIREITO: Ícones */}
                <div className={classes.rightButtons}>
                    <Tooltip title="Anotações">
                        <IconButton onClick={() => setContactNotesModal(true)} className={classes.iconBtn}>
                            <BookOpen size={16} />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Agendar">
                        <IconButton onClick={() => setScheduleModalOpen(true)} className={classes.iconBtn}>
                            <Calendar size={16} />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Tarefas">
                        <IconButton onClick={() => setTaskModalOpen(true)} className={classes.iconBtn}>
                            <PlaylistAddCheck style={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>

                    {/* NOVO: Ícone de Tag com Badge */}
                    <Tooltip title={tagsTooltipText} arrow>
                        <IconButton className={classes.iconBtn} style={{ cursor: "help" }}>
                            <Badge
                                badgeContent={tags.length}
                                color="primary"
                                className={classes.tagBadge}
                                invisible={tags.length === 0}
                            >
                                <LocalOffer style={{ fontSize: 18 }} />
                            </Badge>
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Conversar">
                        <IconButton onClick={handleSelectTicket} className={classes.chatBtn}>
                            <MessageSquare size={16} />
                        </IconButton>
                    </Tooltip>
                </div>
            </div>
        </>
    );
}
