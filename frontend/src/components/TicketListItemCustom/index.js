import React, { useContext, useEffect, useRef, useState, useLayoutEffect } from "react";
import clsx from "clsx";
import { format, isSameDay, parseISO } from "date-fns";
import { useHistory, useParams } from "react-router-dom";
import Avatar from "@material-ui/core/Avatar";
import Badge from "@material-ui/core/Badge";
import Box from "@material-ui/core/Box";
import Divider from "@material-ui/core/Divider";
import ListItem from "@material-ui/core/ListItem";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import Typography from "@material-ui/core/Typography";
import { grey, blue } from "@material-ui/core/colors";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import { useMediaQuery } from "@material-ui/core";
import { i18n } from "../../translate/i18n";

// Ícones Modernos
import { IconButton, Tooltip } from "@material-ui/core";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import HighlightOffIcon from "@material-ui/icons/HighlightOff";
import SwapHorizIcon from "@material-ui/icons/SwapHoriz";
import ReplayIcon from "@material-ui/icons/Replay";
import AndroidIcon from "@material-ui/icons/Android";
import VisibilityIcon from "@material-ui/icons/Visibility";

import { v4 as uuidv4 } from "uuid";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import MarkdownWrapper from "../MarkdownWrapper";
import TicketMessagesDialog from "../TicketMessagesDialog";
import TransferTicketModalCustom from "../TransferTicketModalCustom";
import { getInitials } from "../../helpers/getInitials";
import { generateColor } from "../../helpers/colorGenerator";

const useStyles = makeStyles((theme) => ({
    ticket: {
        position: "relative",
        height: "auto",
        minHeight: 100, // Altura mínima confortável
        padding: "10px 16px",
        width: "100%",
        borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
        borderLeft: "6px solid transparent",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
            backgroundColor: theme.palette.type === "light" ? "rgba(0, 0, 0, 0.02)" : "rgba(255, 255, 255, 0.02)",
        },
    },
    ticketSelected: {
        backgroundColor: `${theme.palette.type === "dark" ? "#1E293B" : "#F0FDF4"} !important`,
        borderLeft: `6px solid ${theme.palette.primary.main} !important`,
        "&:hover": {
            backgroundColor: `${theme.palette.type === "dark" ? "#334155" : "#DCFCE7"} !important`,
        },
    },
    pendingTicket: {
        cursor: "default",
    },
    // --- COLUNA 1: ESQUERDA (Avatar + Ações) ---
    leftColumn: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        marginRight: 16,
        minWidth: 50,
        flexShrink: 0, // Não encolhe
    },
    actionButtons: {
        display: "flex",
        marginTop: 8,
        gap: 4,
        zIndex: 9,
    },
    // --- COLUNA 2: CENTRO (Info do Ticket) ---
    centerColumn: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        width: "100%", // Ocupa o espaço disponível
        paddingRight: 10, // Espaço para não colar na direita
    },
    // --- COLUNA 3: DIREITA (Data, Badge, Contador) ---
    rightColumnContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        justifyContent: "center",
        height: "100%",
        minWidth: 80, // Largura mínima para data/hora
        marginLeft: "auto",
    },
    lastMessageTime: {
        fontSize: "0.7rem",
        color: theme.palette.text.hint,
        fontWeight: 500,
        whiteSpace: "nowrap",
        marginBottom: 6,
    },
    interactionBadge: {
        fontSize: "0.65rem",
        fontWeight: "bold",
        padding: "2px 6px",
        borderRadius: "6px",
        color: "#FFF",
        marginBottom: 4,
        whiteSpace: "nowrap",
        alignSelf: "flex-end",
    },
    newMessagesCount: {
        alignSelf: "flex-end",
        marginTop: 4,
    },
    badgeStyle: {
        color: "white",
        backgroundColor: theme.palette.secondary.main,
        fontSize: "0.7rem",
        height: 18,
        minWidth: 18,
    },
    // Estilos de Texto e Tags
    contactNameWrapper: {
        display: "flex",
        alignItems: "center",
        marginBottom: 4,
        width: "100%",
    },
    contactLastMessage: {
        display: "-webkit-box",
        "-webkit-line-clamp": 1,
        "-webkit-box-orient": "vertical",
        overflow: "hidden",
        fontSize: "0.85rem",
        color: theme.palette.text.secondary,
        lineHeight: 1.4,
        marginBottom: 6,
        wordBreak: "break-word",
        minHeight: "1.4em", // Garante altura mesmo vazio
    },
    secondaryContentSecond: {
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 6,
        marginTop: 4,
        marginBottom: 4,
    },
    tagsContainer: {
        display: "flex",
        flexWrap: "nowrap",
        overflow: "hidden",
        alignItems: "center",
        gap: 4,
        height: 24,
        width: "100%",
    },
    connectionTag: {
        padding: "2px 8px",
        borderRadius: 6,
        fontSize: "0.65rem",
        fontWeight: 600,
        whiteSpace: "nowrap",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        display: "inline-flex",
        alignItems: "center",
        maxWidth: 120,
        overflow: "hidden",
        textOverflow: "ellipsis",
        border: "1px solid transparent", // Para evitar pulo visual no light mode
    },
    ticketQueueColor: {
        flex: "none",
        width: "6px",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
        borderTopLeftRadius: 4,
        borderBottomLeftRadius: 4,
    },
    presence: {
        color: theme.palette.success.main,
        fontWeight: "bold",
        fontSize: "0.8rem",
    },
    // Botões
    btnSuccess: { color: "#10B981", padding: 4, "&:hover": { backgroundColor: "rgba(16, 185, 129, 0.1)" } },
    btnDanger: { color: "#EF4444", padding: 4, "&:hover": { backgroundColor: "rgba(239, 68, 68, 0.1)" } },
    btnPrimary: { color: "#3B82F6", padding: 4, "&:hover": { backgroundColor: "rgba(59, 130, 246, 0.1)" } },
    btnNeutral: { color: "#6B7280", padding: 4, "&:hover": { backgroundColor: "rgba(107, 114, 128, 0.1)" } },
}));

const TicketListItemCustom = ({ ticket }) => {
    const classes = useStyles();
    const theme = useTheme();
    const history = useHistory();
    const [loading, setLoading] = useState(false);
    const [ticketUser, setTicketUser] = useState(null);
    const [tag, setTag] = useState([]);
    const [lastInteractionLabel, setLastInteractionLabel] = useState("");
    const [openTicketMessageDialog, setOpenTicketMessageDialog] = useState(false);
    const { ticketId } = useParams();
    const isMounted = useRef(true);
    const { setCurrentTicket } = useContext(TicketsContext);
    const { user } = useContext(AuthContext);
    const { profile } = user;
    const [transferTicketModalOpen, setTransferTicketModalOpen] = useState(false);
    const presenceMessage = { composing: "Digitando...", recording: "Gravando..." };

    const isMobile = useMediaQuery(theme.breakpoints.down("xs"));

    useEffect(() => {
        if (ticket.userId && ticket.user) {
            setTicketUser(ticket.user?.name?.toUpperCase());
        }
        setTag(ticket?.tags);
        return () => {
            isMounted.current = false;
        };
    }, [ticket]);

    const handleCloseTicket = async (id) => {
        setTag(ticket?.tags);
        setLoading(true);
        try {
            await api.put(`/tickets/${id}`, {
                status: "closed",
                userId: user?.id,
                queueId: ticket?.queue?.id,
                useIntegration: false,
                promptId: null,
                integrationId: null,
            });
        } catch (err) {
            setLoading(false);
            toastError(err);
        }
        if (isMounted.current) {
            setLoading(false);
        }
        history.push(`/tickets/`);
    };

    useEffect(() => {
        const renderLastInteractionLabel = () => {
            let labelColor = "";
            let labelText = "";
            if (!ticket.lastMessage) return { labelText: "", labelColor: "" };
            const lastInteractionDate = parseISO(ticket.updatedAt);
            const currentDate = new Date();
            const timeDifference = currentDate - lastInteractionDate;
            const hoursDifference = Math.floor(timeDifference / (1000 * 60 * 60));
            const minutesDifference = Math.floor(timeDifference / (1000 * 60));

            if (minutesDifference <= 10) {
                labelText = `${minutesDifference}m`;
                labelColor = "#10B981";
            } else if (minutesDifference < 60) {
                labelText = `${minutesDifference}m`;
                labelColor = "#F59E0B";
            } else if (hoursDifference < 24) {
                labelText = `${hoursDifference}h`;
                labelColor = "#EF4444";
            } else {
                labelText = `${Math.floor(hoursDifference / 24)}d`;
                labelColor = "#EF4444";
            }
            return { labelText, labelColor };
        };

        const updateLastInteractionLabel = () => {
            const { labelText, labelColor } = renderLastInteractionLabel();
            if (labelText) {
                setLastInteractionLabel(
                    <span className={classes.interactionBadge} style={{ backgroundColor: labelColor }}>
                        {labelText}
                    </span>
                );
            } else {
                setLastInteractionLabel("");
            }
        };
        updateLastInteractionLabel();
    }, [ticket, classes.interactionBadge]);

    const handleReopenTicket = async (id) => {
        setLoading(true);
        try {
            await api.put(`/tickets/${id}`, {
                status: "open",
                userId: user?.id,
                queueId: ticket?.queue?.id,
            });
        } catch (err) {
            setLoading(false);
            toastError(err);
        }
        if (isMounted.current) {
            setLoading(false);
        }
        history.push(`/tickets/${ticket.uuid}`);
    };

    const handleAcepptTicket = async (id) => {
        setLoading(true);
        try {
            await api.put(`/tickets/${id}`, {
                status: "open",
                userId: user?.id,
            });

            let settingIndex;
            try {
                const { data } = await api.get("/settings/");
                settingIndex = data.filter((s) => s.key === "sendGreetingAccepted");
            } catch (err) {
                toastError(err);
            }

            if (settingIndex && settingIndex[0].value === "enabled" && !ticket.isGroup) {
                handleSendMessage(ticket.id);
            }
        } catch (err) {
            setLoading(false);
            toastError(err);
        }
        if (isMounted.current) {
            setLoading(false);
        }
        history.push(`/tickets/${ticket.uuid}`);
    };

    const handleSendMessage = async (id) => {
        const msg = `{{ms}} *{{firstName}}*, meu nome é *${user?.name}* e agora vou prosseguir com seu atendimento!`;
        const message = {
            read: 1,
            fromMe: true,
            mediaUrl: "",
            body: `*Mensagem Automática:*\n${msg.trim()}`,
        };
        try {
            await api.post(`/messages/${id}`, message);
        } catch (err) {
            toastError(err);
        }
    };

    const handleSelectTicket = (ticket) => {
        const code = uuidv4();
        const { id, uuid } = ticket;
        setCurrentTicket({ id, uuid, code });
    };

    const handleOpenTransferModal = () => {
        setTransferTicketModalOpen(true);
    };

    const handleCloseTransferTicketModal = () => {
        if (isMounted.current) {
            setTransferTicketModalOpen(false);
        }
    };

    const tagsContainerRef = useRef(null);
    const [visibleTagsCount, setVisibleTagsCount] = useState(4);

    // --- HELPER PARA MEDIR LARGURA DO TEXTO ---
    const getTextWidth = (text, font) => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        context.font = font;
        return context.measureText(text).width;
    };

    // --- CÁLCULO ASSERTIVO DE VISIBILIDADE DAS TAGS ---
    useLayoutEffect(() => {
        const calculateVisibleTags = () => {
            if (!tagsContainerRef.current || !tag || tag.length === 0) return;

            const containerWidth = tagsContainerRef.current.offsetWidth;
            
            // Constantes de estilo (baseadas no CSS .connectionTag e gap)
            // Padding Horizontal (8px * 2) + Gap (4px)
            const tagPadding = 16; 
            const tagGap = 4;
            const moreBadgeWidth = 45; // Largura segura para o badge "+X"
            
            let totalWidth = 0;
            let count = 0;
            // Fonte aproximada do CSS (0.65rem bold)
            const font = "600 12px Roboto, sans-serif"; 

            for (let i = 0; i < tag.length; i++) {
                const tagName = tag[i].name ? tag[i].name.toUpperCase() : "";
                const textWidth = getTextWidth(tagName, font);
                const currentTagWidth = textWidth + tagPadding;

                // Espaço que esta tag ocuparia (incluindo o gap se não for a primeira)
                const spaceForThisTag = currentTagWidth + (i > 0 ? tagGap : 0);

                // Verifica se é a última tag da lista
                const isLastItem = i === tag.length - 1;

                // Se NÃO for a última, precisamos ver se cabe ELA + o BADGE +X
                // Se for a última, precisamos ver se cabe apenas ELA
                const requiredSpace = isLastItem 
                    ? spaceForThisTag 
                    : spaceForThisTag + moreBadgeWidth + tagGap;

                if (totalWidth + requiredSpace <= containerWidth) {
                    totalWidth += spaceForThisTag;
                    count++;
                } else {
                    break; 
                }
            }

            // Garante mostrar pelo menos 1 se houver tags (trunca com ... se necessário via CSS)
            // Ou 0 se não houver tags
            setVisibleTagsCount(tag.length > 0 ? Math.max(1, count) : 0);
        };

        calculateVisibleTags();
        window.addEventListener("resize", calculateVisibleTags);
        return () => window.removeEventListener("resize", calculateVisibleTags);
    }, [tag]);

    // --- HELPER PARA COR DO BADGE (LIGHT vs DARK) ---
    const getBadgeStyle = (color) => {
        const isDark = theme.palette.type === "dark";
        const finalColor = color || "#7c7c7c";

        if (isDark) {
            // DARK: Fundo translúcido, texto branco, sem borda (ou borda suave)
            return {
                backgroundColor: finalColor + "33", // Transparência
                color: "#FFF",
                border: `1px solid ${finalColor}`,
            };
        } else {
            // LIGHT: Estilo Clean
            // Fundo muito suave (quase branco), texto na cor, borda fina na cor
            return {
                backgroundColor: finalColor + "15", // 15 = ~8% opacidade (bem clarinho)
                color: finalColor,
                border: `1px solid ${finalColor}60`, // Borda semi-transparente
            };
        }
    };

    return (
        <React.Fragment key={ticket.id}>
            <TransferTicketModalCustom
                modalOpen={transferTicketModalOpen}
                onClose={handleCloseTransferTicketModal}
                ticketid={ticket.id}
            />

            <TicketMessagesDialog
                open={openTicketMessageDialog}
                handleClose={() => setOpenTicketMessageDialog(false)}
                ticketId={ticket.id}
            />

            <ListItem
                dense
                button
                onClick={(e) => {
                    if (ticket.status === "pending") return;
                    handleSelectTicket(ticket);
                }}
                selected={ticketId && +ticketId === ticket.id}
                className={clsx(classes.ticket, {
                    [classes.pendingTicket]: ticket.status === "pending",
                    [classes.ticketSelected]: ticketId && +ticketId === ticket.id,
                })}
            >
                <Tooltip arrow placement="right" title={ticket.queue?.name?.toUpperCase() || "SEM FILA"}>
                    <span
                        style={{ backgroundColor: ticket.queue?.color || "#7C7C7C" }}
                        className={classes.ticketQueueColor}
                    ></span>
                </Tooltip>

                {/* COLUNA 1: ESQUERDA (Avatar + Ações) */}
                <Box className={classes.leftColumn}>
                    <Avatar
                        style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "50%",
                            backgroundColor: generateColor(ticket?.contact?.number),
                            border: `2px solid ${theme.palette.background.paper}`,
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        }}
                        src={ticket?.contact?.profilePicUrl}
                    >
                        {getInitials(ticket?.contact?.name || "")}
                    </Avatar>

                    <Box className={classes.actionButtons} onClick={(e) => e.stopPropagation()}>
                        {(ticket.status === "pending" || ticket.status === "attending") && (
                            <>
                                <Tooltip title={i18n.t("ticketsList.buttons.accept")}>
                                    <IconButton
                                        className={classes.btnSuccess}
                                        onClick={() => handleAcepptTicket(ticket.id)}
                                        size="small"
                                    >
                                        <CheckCircleIcon fontSize="inherit" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={i18n.t("ticketsList.buttons.closed")}>
                                    <IconButton
                                        className={classes.btnDanger}
                                        onClick={() => handleCloseTicket(ticket.id)}
                                        size="small"
                                    >
                                        <HighlightOffIcon fontSize="inherit" />
                                    </IconButton>
                                </Tooltip>
                            </>
                        )}
                        {(ticket.status === "open" ||
                            (ticket.status !== "closed" &&
                                ticket.status !== "pending" &&
                                ticket.status !== "attending")) && (
                            <>
                                <Tooltip title={i18n.t("ticketsList.buttons.transfer")}>
                                    <IconButton
                                        className={classes.btnPrimary}
                                        onClick={() => handleOpenTransferModal()}
                                        size="small"
                                    >
                                        <SwapHorizIcon fontSize="inherit" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={i18n.t("ticketsList.buttons.closed")}>
                                    <IconButton
                                        className={classes.btnDanger}
                                        onClick={() => handleCloseTicket(ticket.id)}
                                        size="small"
                                    >
                                        <HighlightOffIcon fontSize="inherit" />
                                    </IconButton>
                                </Tooltip>
                            </>
                        )}
                        {ticket.status === "closed" && (
                            <Tooltip title={i18n.t("ticketsList.buttons.reopen")}>
                                <IconButton
                                    className={classes.btnNeutral}
                                    onClick={() => handleReopenTicket(ticket.id)}
                                    size="small"
                                >
                                    <ReplayIcon fontSize="inherit" />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                </Box>

                {/* COLUNA 2: CENTRO (Informações) */}
                <Box className={classes.centerColumn}>
                    {/* Linha 1: Nome + Espiar */}
                    <div className={classes.contactNameWrapper}>
                        <Typography
                            noWrap
                            component="span"
                            variant="body2"
                            color="textPrimary"
                            style={{ fontWeight: 700, fontSize: "0.95rem" }}
                        >
                            {ticket.contact.name}
                        </Typography>
                        {ticket.chatbot && (
                            <Tooltip title="Chatbot">
                                <AndroidIcon
                                    fontSize="small"
                                    style={{ color: grey[700], marginLeft: 6, fontSize: 16 }}
                                />
                            </Tooltip>
                        )}
                        {profile === "admin" && (
                            <Tooltip title="Espiar">
                                <VisibilityIcon
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenTicketMessageDialog(true);
                                    }}
                                    fontSize="small"
                                    style={{ color: blue[700], cursor: "pointer", marginLeft: 8, fontSize: 18 }}
                                />
                            </Tooltip>
                        )}
                    </div>

                    {/* Linha 2: Última Mensagem */}
                    <div className={classes.contactLastMessage}>
                        {["composing", "recording"].includes(ticket?.presence) ? (
                            <span className={classes.presence}>{presenceMessage[ticket.presence]}</span>
                        ) : (
                            <>
                                {ticket.lastMessage ? (
                                    ticket.lastMessage.includes("data:image/png;base64") ? (
                                        <MarkdownWrapper> Localização</MarkdownWrapper>
                                    ) : (
                                        <MarkdownWrapper>{ticket.lastMessage}</MarkdownWrapper>
                                    )
                                ) : (
                                    <span style={{ fontStyle: "italic", opacity: 0.6 }}>Sem mensagens</span>
                                )}
                            </>
                        )}
                    </div>

                    {/* Linha 3: Tags Fixas (Conexão, Usuário, Fila) */}
                    <div className={classes.secondaryContentSecond}>
                        {ticket?.whatsapp?.name && (
                            <span className={classes.connectionTag} style={getBadgeStyle("#25D366")}>
                                {ticket?.whatsapp?.name?.toUpperCase()}
                            </span>
                        )}
                        {ticketUser && (
                            <span className={classes.connectionTag} style={getBadgeStyle("#3B82F6")}>
                                {ticketUser}
                            </span>
                        )}
                        <span className={classes.connectionTag} style={getBadgeStyle(ticket.queue?.color || "#7c7c7c")}>
                            {ticket.queue?.name?.toUpperCase() || "SEM FILA"}
                        </span>
                    </div>

                    {/* Linha 4: Tags do Contato */}
                    <div className={classes.tagsContainer} ref={tagsContainerRef}>
                        {tag?.slice(0, visibleTagsCount).map((tag) => (
                            <span
                                key={`ticket-contact-tag-${ticket.id}-${tag.id}`}
                                className={classes.connectionTag}
                                style={getBadgeStyle(tag.color)}
                            >
                                {tag.name.toUpperCase()}
                            </span>
                        ))}
                        {tag?.length > visibleTagsCount && (
                            <Tooltip
                                arrow
                                placement="top"
                                title={tag
                                    .slice(visibleTagsCount)
                                    .map((t) => t.name)
                                    .join(", ")}
                            >
                                <span className={classes.connectionTag} style={getBadgeStyle("#9CA3AF")}>
                                    +{tag.length - visibleTagsCount}
                                </span>
                            </Tooltip>
                        )}
                    </div>
                </Box>

                {/* COLUNA 3: DIREITA (Meta Info) */}
                <ListItemSecondaryAction style={{ height: "100%", top: 0, right: 16, transform: "none" }}>
                    <Box className={classes.rightColumnContainer}>
                        <Box style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                            {lastInteractionLabel}
                            <Badge
                                className={classes.newMessagesCount}
                                badgeContent={ticket.unreadMessages}
                                classes={{ badge: classes.badgeStyle }}
                            />
                        </Box>

                        {ticket.lastMessage && (
                            <Typography className={classes.lastMessageTime} component="span" variant="body2">
                                {isSameDay(parseISO(ticket.updatedAt), new Date()) ? (
                                    <>{format(parseISO(ticket.updatedAt), "HH:mm")}</>
                                ) : (
                                    <>{format(parseISO(ticket.updatedAt), "dd/MM/yy")}</>
                                )}
                            </Typography>
                        )}
                    </Box>
                </ListItemSecondaryAction>
            </ListItem>
            <Divider variant="inset" component="li" />
        </React.Fragment>
    );
};

export default TicketListItemCustom;
