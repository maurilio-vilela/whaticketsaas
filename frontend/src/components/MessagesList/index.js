import React, { useState, useEffect, useReducer, useRef, useContext } from "react";
import { isSameDay, parseISO, format } from "date-fns";
import clsx from "clsx";
import { green } from "@material-ui/core/colors";
import {
    Button,
    CircularProgress,
    Divider,
    IconButton,
    makeStyles,
    Typography,
    Avatar,
    Tooltip,
} from "@material-ui/core";
import {
    AccessTime,
    Block,
    Done,
    DoneAll,
    ExpandMore,
    GetApp,
    Reply,
    Person as PersonIcon,
    PictureAsPdf as PdfIcon,
    Image as ImageIcon,
    InsertDriveFile as FileIcon,
    AccessTimeRounded,
    CallMerge,
} from "@material-ui/icons";

import ModalImageCors from "../ModalImageCors";
import AudioModal from "../AudioModal";
import MarkdownWrapper from "../MarkdownWrapper";
import MessageOptionsMenu from "../MessageOptionsMenu";
import LocationPreview from "../LocationPreview";
import VCardPreview from "../VCardPreview";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { SocketContext } from "../../context/Socket/SocketContext";
import { ForwardMessageContext } from "../../context/ForwarMessage/ForwardMessageContext";
import { ReplyMessageContext } from "../../context/ReplyingMessage/ReplyingMessageContext";
import SelectMessageCheckbox from "./SelectMessageCheckbox";
import { AuthContext } from "../../context/Auth/AuthContext";
import { useLocation } from "react-router-dom";

// --- MANTIVE OS SEUS STYLES EXATAMENTE IGUAIS ---
const useStyles = makeStyles((theme) => ({
    messagesListWrapper: {
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        width: "100%",
        minWidth: 300,
        minHeight: 200,
        backgroundColor: theme.palette.fancyBackground,
    },
    messagesList: {
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        padding: "20px",
        overflowY: "scroll",
        ...theme.scrollbarStyles,
    },
    circleLoading: {
        color: theme.palette.primary.main,
        position: "absolute",
        opacity: "70%",
        top: 0,
        left: "50%",
        marginTop: 12,
    },
    messageLeftContainer: {
        display: "flex",
        alignItems: "flex-start",
        marginBottom: 15,
        alignSelf: "flex-start",
        maxWidth: "60%",
        [theme.breakpoints.down("sm")]: { maxWidth: "97%" },
    },
    messageRightContainer: {
        display: "flex",
        alignItems: "flex-start",
        marginBottom: 15,
        alignSelf: "flex-end",
        justifyContent: "flex-end",
        maxWidth: "60%",
        [theme.breakpoints.down("sm")]: { maxWidth: "97%" },
    },
    avatar: {
        width: 32,
        height: 32,
        marginRight: 8,
        marginLeft: 8,
        marginTop: 0,
        backgroundColor: theme.palette.mode === "light" ? "#BDBDBD" : "#555",
    },
    displayName: {
        fontSize: "12px",
        color: theme.palette.options,
        marginBottom: 4,
        marginLeft: 4,
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
    },
    messageLeft: {
        marginRight: 0,
        minWidth: 100,
        maxWidth: "100%",
        height: "auto",
        display: "block",
        position: "relative",
        "&:hover #messageActionsButton": { opacity: 1, pointerEvents: "auto" },
        whiteSpace: "pre-wrap",
        backgroundColor: theme.palette.messageLeftBackground || "#FFFFFF",
        color: theme.palette.text.primary,
        borderRadius: "0px 16px 16px 16px",
        padding: "6px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
        overflow: "visible",
        transition: "background-color 0.3s ease",
    },
    messageRight: {
        marginLeft: 0,
        minWidth: 100,
        maxWidth: "100%",
        height: "auto",
        display: "block",
        position: "relative",
        "&:hover #messageActionsButton": { opacity: 1, pointerEvents: "auto" },
        whiteSpace: "pre-wrap",
        background: theme.palette.messageRightBackground || "#00a884",
        color: "#FFFFFF",
        borderRadius: "16px 0px 16px 16px",
        padding: "6px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
        overflow: "visible",
        transition: "background-color 0.3s ease",
    },
    highlightMessage: {
        backgroundColor: "#ffeb3b !important",
        color: "#000 !important",
        animation: "$flash 2s ease-in-out",
    },
    "@keyframes flash": {
        "0%": { backgroundColor: "#ffeb3b" },
        "50%": { backgroundColor: "#ffeb3b" },
        "100%": { backgroundColor: "inherit" },
    },
    messageActionsButton: {
        display: "flex",
        position: "absolute",
        top: 2,
        right: 0,
        opacity: 0,
        pointerEvents: "none",
        transition: "opacity 0.2s ease-in-out",
        color: "inherit",
        zIndex: 2,
        padding: 4,
    },
    quotedContainerLeft: {
        margin: "0 0 8px 0",
        overflow: "hidden",
        backgroundColor: "rgba(0,0,0,0.05)",
        borderRadius: "8px",
        display: "flex",
        position: "relative",
        borderLeft: `4px solid ${theme.palette.secondary.main}`,
        cursor: "pointer",
        pointerEvents: "auto",
        "&:hover": { backgroundColor: "rgba(0,0,0,0.1)" },
    },
    quotedContainerRight: {
        margin: "0 0 8px 0",
        overflow: "hidden",
        backgroundColor: "rgba(0,0,0,0.2)",
        borderRadius: "8px",
        display: "flex",
        position: "relative",
        borderLeft: "4px solid #FFFFFF",
        cursor: "pointer",
        pointerEvents: "auto",
        "&:hover": { backgroundColor: "rgba(0,0,0,0.25)" },
    },
    quotedMsg: {
        padding: 8,
        maxWidth: 300,
        height: "auto",
        display: "block",
        whiteSpace: "pre-wrap",
        overflow: "hidden",
        fontSize: "0.9rem",
    },
    quotedSideColorLeft: { width: "4px", backgroundColor: theme.palette.secondary.main },
    quotedSideColorRight: { width: "4px", backgroundColor: "#FFFFFF" },
    textContentItem: { overflowWrap: "break-word", padding: "8px", marginBottom: "10px" },
    textContentItemEdited: {
        overflowWrap: "break-word",
        padding: "8px",
        marginBottom: "10px",
        fontStyle: "italic",
        opacity: 0.8,
    },
    textContentItemDeleted: {
        fontStyle: "italic",
        color: "rgba(0, 0, 0, 0.36)",
        overflowWrap: "break-word",
        padding: "8px",
        marginBottom: "10px",
    },
    timestamp: {
        fontSize: 10,
        position: "absolute",
        bottom: 5,
        right: 10,
        color: "inherit",
        opacity: 0.8,
        display: "flex",
        alignItems: "center",
        gap: 4,
    },
    dailyTimestamp: { display: "flex", justifyContent: "center", margin: "16px 0" },
    dailyTimestampText: {
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.options,
        padding: "4px 12px",
        borderRadius: "12px",
        fontSize: "0.75rem",
        fontWeight: 600,
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    },
    ackIcons: { fontSize: 16, color: "inherit" },
    ackDoneAllIcon: { fontSize: 16, color: theme.palette.mode === "light" ? "#6EE7B7" : "#34D399" },
    messageMedia: { objectFit: "cover", width: "100%", maxWidth: 300, height: 200, borderRadius: 8, marginBottom: 4 },
    downloadMedia: {
        display: "flex",
        alignItems: "center",
        padding: "10px",
        borderRadius: 8,
        backgroundColor: "rgba(0,0,0,0.1)",
        marginBottom: 4,
        minWidth: 200,
        border: "1px solid rgba(0,0,0,0.05)",
        cursor: "pointer",
        textDecoration: "none",
        color: "inherit",
        "&:hover": { backgroundColor: "rgba(0,0,0,0.15)" },
    },
    downloadIcon: { marginRight: 10, fontSize: 30, color: theme.palette.secondary.main },
    reactionsContainer: {
        position: "absolute",
        bottom: -10,
        right: 5,
        display: "flex",
        gap: 4,
        zIndex: 10,
        pointerEvents: "none",
    },
    reactionBadge: {
        backgroundColor: theme.palette.background.paper,
        color: "#000",
        border: `1px solid ${theme.palette.divider}`,
        padding: "2px 5px",
        borderRadius: 12,
        fontSize: "14px",
        minWidth: "24px",
        justifyContent: "center",
        display: "flex",
        alignItems: "center",
        boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
        cursor: "default",
        pointerEvents: "auto",
    },
}));

// --- REDUCER CORRIGIDO (Puro, sem mutação direta) ---
const reducer = (state, action) => {
    if (action.type === "LOAD_MESSAGES") {
        const messages = action.payload;
        const newMessages = [];
        messages.forEach((message) => {
            const messageIndex = state.findIndex((m) => m.id === message.id);
            if (messageIndex === -1) {
                newMessages.push(message);
            }
        });
        return [...newMessages, ...state];
    }
    if (action.type === "ADD_MESSAGE") {
        const newMessage = action.payload;
        const messageIndex = state.findIndex((m) => m.id === newMessage.id);
        if (messageIndex !== -1) {
            // Retorna um novo array substituindo a mensagem editada
            return state.map((m) => (m.id === newMessage.id ? newMessage : m));
        } else {
            // Retorna um novo array adicionando ao final
            return [...state, newMessage];
        }
    }
    if (action.type === "UPDATE_MESSAGE") {
        const messageToUpdate = action.payload;
        return state.map((m) => {
            if (m.id === messageToUpdate.id) {
                return messageToUpdate.isDeleted ? { ...m, ...messageToUpdate } : messageToUpdate;
            }
            return m;
        });
    }
    if (action.type === "RESET") {
        return [];
    }
    return state;
};

const MessagesList = ({ ticket, ticketId, isGroup }) => {
    const classes = useStyles();
    const location = useLocation();

    const [messagesList, dispatch] = useReducer(reducer, []);
    const [pageNumber, setPageNumber] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const lastMessageRef = useRef();

    const [selectedMessage, setSelectedMessage] = useState({});
    const [anchorEl, setAnchorEl] = useState(null);
    const messageOptionsMenuOpen = Boolean(anchorEl);
    const currentTicketId = useRef(ticketId);
    const socketManager = useContext(SocketContext);
    const { setReplyingMessage } = useContext(ReplyMessageContext);
    const { showSelectMessageCheckbox, setSelectedMessages } = useContext(ForwardMessageContext);
    const { user } = useContext(AuthContext);

    const [targetMessageId, setTargetMessageId] = useState(null);

    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const msgId = query.get("messageId");
        if (msgId) setTargetMessageId(msgId);
    }, [location.search]);

    const scrollToMessage = (messageId) => {
        const messageElement = document.getElementById(`message-${messageId}`);
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
            const bubble =
                messageElement.querySelector(`.${classes.messageLeft}`) ||
                messageElement.querySelector(`.${classes.messageRight}`);
            if (bubble) {
                bubble.classList.add(classes.highlightMessage);
                setTimeout(() => bubble.classList.remove(classes.highlightMessage), 3000);
            }
            return true;
        }
        return false;
    };

    useEffect(() => {
        if (targetMessageId && messagesList.length > 0 && !loading) {
            const found = scrollToMessage(targetMessageId);
            if (!found && hasMore) {
                setPageNumber((prev) => prev + 1);
            } else if (found) {
                setTargetMessageId(null);
            }
        }
    }, [messagesList, targetMessageId, loading, hasMore]);

    useEffect(() => {
        dispatch({ type: "RESET" });
        setPageNumber(1);
        currentTicketId.current = ticketId;
    }, [ticketId]);

    useEffect(() => {
        setLoading(true);
        const delayDebounceFn = setTimeout(() => {
            const fetchMessages = async () => {
                if (ticketId === undefined) return;
                try {
                    const { data } = await api.get("/messages/" + ticketId, {
                        params: { pageNumber },
                    });
                    if (currentTicketId.current === ticketId) {
                        dispatch({ type: "LOAD_MESSAGES", payload: data.messages });
                        setHasMore(data.hasMore);
                        setLoading(false);
                    }
                    if (pageNumber === 1 && data.messages.length > 1) {
                        scrollToBottom();
                    }
                } catch (err) {
                    setLoading(false);
                    toastError(err);
                }
            };
            fetchMessages();
        }, 500);
        return () => {
            clearTimeout(delayDebounceFn);
        };
    }, [pageNumber, ticketId]);

    useEffect(() => {
        return () => {
            setSelectedMessages([]);
        };
    }, [ticketId, setSelectedMessages]);

    // --- SOCKET CORRIGIDO ---
    useEffect(() => {
        const companyId = localStorage.getItem("companyId");
        const socket = socketManager.getSocket(companyId);

        socket.on("ready", () => socket.emit("joinChatBox", `${ticket.id}`));

        const messageListener = (data) => {
            if (data.action === "create" && data.message.ticketId === currentTicketId.current) {
                dispatch({ type: "ADD_MESSAGE", payload: data.message });
                scrollToBottom();
            }
            if (data.action === "update" && data.message.ticketId === currentTicketId.current) {
                if (data.message.isEdited) {
                    dispatch({
                        type: "UPDATE_MESSAGE",
                        payload: { ...data.message, body: data.message.body || "Mensagem editada" },
                    });
                } else {
                    dispatch({ type: "UPDATE_MESSAGE", payload: data.message });
                }
            }
        };

        socket.on(`company-${companyId}-appMessage`, messageListener);

        return () => {
            // A CURA: Removemos apenas os Listeners em vez de matar o socket inteiro
            socket.off("ready");
            socket.off(`company-${companyId}-appMessage`, messageListener);
        };
    }, [ticketId, ticket, socketManager]);

    const loadMore = () => {
        setPageNumber((prevPageNumber) => prevPageNumber + 1);
    };

    const scrollToBottom = () => {
        if (lastMessageRef.current) {
            lastMessageRef.current.scrollIntoView({});
        }
    };

    const handleScroll = (e) => {
        if (!hasMore) return;
        const { scrollTop } = e.currentTarget;
        if (scrollTop === 0) {
            document.getElementById("messagesList").scrollTop = 1;
        }
        if (loading) return;
        if (scrollTop < 50) loadMore();
    };

    const hanldeReplyMessage = (e, message) => {
        setAnchorEl(null);
        setReplyingMessage(message);
    };

    const handleOpenMessageOptionsMenu = (e, message) => {
        setAnchorEl(e.currentTarget);
        setSelectedMessage(message);
    };

    const handleCloseMessageOptionsMenu = (e) => {
        setAnchorEl(null);
    };

    const checkMessageMedia = (message) => {
        if (message.mediaType === "locationMessage" && message.body.split("|").length >= 2) {
            let locationParts = message.body.split("|");
            let imageLocation = locationParts[0];
            let linkLocation = locationParts[1];
            let descriptionLocation = null;
            if (locationParts.length > 2) descriptionLocation = message.body.split("|")[2];
            return <LocationPreview image={imageLocation} link={linkLocation} description={descriptionLocation} />;
        } else if (message.mediaType === "contactMessage") {
            let array = message.body.split("\n");
            let obj = [];
            let contact = "";
            for (let index = 0; index < array.length; index++) {
                const v = array[index];
                let values = v.split(":");
                for (let ind = 0; ind < values.length; ind++) {
                    if (values[ind].indexOf("+") !== -1) {
                        obj.push({ number: values[ind] });
                    }
                    if (values[ind].indexOf("FN") !== -1) {
                        contact = values[ind + 1];
                    }
                }
            }
            return <VCardPreview contact={contact} numbers={obj[0]?.number} />;
        } else if (message.mediaType === "image") {
            return <ModalImageCors imageUrl={message.mediaUrl} />;
        } else if (message.mediaType === "audio") {
            return <AudioModal url={message.mediaUrl} />;
        } else if (message.mediaType === "video") {
            return <video className={classes.messageMedia} src={message.mediaUrl} controls />;
        } else if (message.mediaUrl) {
            const fileName = message.body || message.mediaUrl.split("/").pop() || "Arquivo";
            const fileExt = message.mediaUrl.split(".").pop().toLowerCase();
            const isPdf = fileExt === "pdf";
            return (
                <>
                    <div className={classes.downloadMedia}>
                        <Button
                            startIcon={isPdf ? <PdfIcon /> : <GetApp />}
                            variant="outlined"
                            target="_blank"
                            href={message.mediaUrl}
                        >
                            {fileName.length > 20 ? fileName.substring(0, 20) + "..." : "Download"}
                        </Button>
                    </div>
                    <Divider />
                </>
            );
        }
        return null;
    };

    const renderMessageAck = (message) => {
        if (message.ack === 0) return <AccessTime fontSize="small" className={classes.ackIcons} />;
        if (message.ack === 1) return <Done fontSize="small" className={classes.ackIcons} />;
        if (message.ack === 2) return <Done fontSize="small" className={classes.ackIcons} />;
        if (message.ack === 3) return <DoneAll fontSize="small" className={classes.ackIcons} />;
        if (message.ack === 4 || message.ack === 5)
            return <DoneAll fontSize="small" className={classes.ackDoneAllIcon} style={{ color: "#0377FC" }} />;
    };

    const renderDailyTimestamps = (message, index) => {
        if (index === 0) {
            return (
                <span className={classes.dailyTimestamp} key={`timestamp-${message.id}`}>
                    <div className={classes.dailyTimestampText}>
                        {format(parseISO(messagesList[index].createdAt), "dd/MM/yyyy")}
                    </div>
                </span>
            );
        }
        if (index < messagesList.length - 1) {
            let messageDay = parseISO(messagesList[index].createdAt);
            let previousMessageDay = parseISO(messagesList[index - 1].createdAt);
            if (!isSameDay(messageDay, previousMessageDay)) {
                return (
                    <span className={classes.dailyTimestamp} key={`timestamp-${message.id}`}>
                        <div className={classes.dailyTimestampText}>
                            {format(parseISO(messagesList[index].createdAt), "dd/MM/yyyy")}
                        </div>
                    </span>
                );
            }
        }
        if (index === messagesList.length - 1) {
            return (
                <div key={`ref-${message.createdAt}`} ref={lastMessageRef} style={{ float: "left", clear: "both" }} />
            );
        }
    };

    const renderNumberTicket = (message, index) => {
        if (index < messagesList.length && index > 0) {
            let messageTicket = message.ticketId;
            let previousMessageTicket = messagesList[index - 1].ticketId;
            if (messageTicket !== previousMessageTicket) {
                return (
                    <center>
                        <div className={classes.ticketNunberClosed}>
                            Conversa encerrada:{" "}
                            {format(parseISO(messagesList[index - 1].createdAt), "dd/MM/yyyy HH:mm:ss")}
                        </div>
                        <div className={classes.ticketNunberOpen}>
                            Conversa iniciada: {format(parseISO(message.createdAt), "dd/MM/yyyy HH:mm:ss")}
                        </div>
                    </center>
                );
            }
        }
    };

    const renderMessageDivider = (message, index) => {
        if (index < messagesList.length && index > 0) {
            let messageUser = messagesList[index].fromMe;
            let previousMessageUser = messagesList[index - 1].fromMe;
            if (messageUser !== previousMessageUser) {
                return <span style={{ marginTop: 16 }} key={`divider-${message.id}`}></span>;
            }
        }
    };

    const renderQuotedMessage = (message) => {
        return (
            <div
                className={clsx(classes.quotedContainerLeft, { [classes.quotedContainerRight]: message.fromMe })}
                onClick={() => {
                    if (message.quotedMsg?.id) {
                        const found = scrollToMessage(message.quotedMsg.id);
                        if (!found) {
                            setTargetMessageId(message.quotedMsg.id);
                        }
                    }
                }}
            >
                <span
                    className={clsx(classes.quotedSideColorLeft, {
                        [classes.quotedSideColorRight]: message.quotedMsg?.fromMe,
                    })}
                ></span>
                <div className={classes.quotedMsg}>
                    {!message.quotedMsg?.fromMe && (
                        <span className={classes.messageContactName}>{message.quotedMsg?.contact?.name}</span>
                    )}
                    {message.quotedMsg.mediaType === "audio" && (
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <AccessTimeRounded style={{ marginRight: 5 }} /> Áudio
                        </div>
                    )}
                    {message.quotedMsg.mediaType === "video" && (
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <GetApp style={{ marginRight: 5 }} /> Vídeo
                        </div>
                    )}
                    {message.quotedMsg.mediaType === "image" && (
                        <ModalImageCors imageUrl={message.quotedMsg.mediaUrl} />
                    )}
                    <span style={{ display: "block", marginTop: 5 }}>{message.quotedMsg?.body}</span>
                </div>
            </div>
        );
    };

    const renderMessages = () => {
        if (messagesList.length > 0) {
            const viewMessagesList = messagesList.map((message, index) => {
                if (message.mediaType === "call_log") {
                    return (
                        <React.Fragment key={message.id}>
                            {renderDailyTimestamps(message, index)}
                            {renderNumberTicket(message, index)}
                            {renderMessageDivider(message, index)}
                            <div className={classes.messageCenter}>
                                <IconButton
                                    variant="contained"
                                    size="small"
                                    id="messageActionsButton"
                                    disabled={message.isDeleted}
                                    className={classes.messageActionsButton}
                                    onClick={(e) => handleOpenMessageOptionsMenu(e, message)}
                                >
                                    <ExpandMore />
                                </IconButton>
                                {isGroup && <span className={classes.messageContactName}>{message.contact?.name}</span>}
                                <div>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 17" width="20" height="17">
                                        <path
                                            fill="#df3333"
                                            d="M18.2 12.1c-1.5-1.8-5-2.7-8.2-2.7s-6.7 1-8.2 2.7c-.7.8-.3 2.3.2 2.8.2.2.3.3.5.3 1.4 0 3.6-.7 3.6-.7.5-.2.8-.5.8-1v-1.3c.7-1.2 5.4-1.2 6.4-.1l.1.1v1.3c0 .2.1.4.2.6.1.2.3.3.5.4 0 0 2.2.7 3.6.7.2 0 1.4-2 .5-3.1zM5.4 3.2l4.7 4.6 5.8-5.7-.9-.8L10.1 6 6.4 2.3h2.5V1H4.1v4.8h1.3V3.2z"
                                        ></path>
                                    </svg>{" "}
                                    <span>
                                        Chamada de voz/vídeo perdida às {format(parseISO(message.createdAt), "HH:mm")}
                                    </span>
                                </div>
                            </div>
                        </React.Fragment>
                    );
                }

                const isMe = message.fromMe;

                return (
                    <React.Fragment key={message.id}>
                        {renderDailyTimestamps(message, index)}
                        {renderNumberTicket(message, index)}
                        {renderMessageDivider(message, index)}

                        <div
                            className={isMe ? classes.messageRightContainer : classes.messageLeftContainer}
                            id={`message-${message.id}`}
                        >
                            {!isMe && (
                                <Tooltip
                                    title={
                                        ticket?.contact?.secondaryNumber
                                            ? `Multinúmero: ${ticket.contact.number} / ${ticket.contact.secondaryNumber}`
                                            : ticket?.contact?.name
                                    }
                                    arrow
                                >
                                    <Avatar
                                        src={ticket?.contact?.profilePicUrl || undefined}
                                        className={classes.avatar}
                                        alt={ticket?.contact?.name}
                                        style={{ cursor: "help" }}
                                    >
                                        <PersonIcon />
                                    </Avatar>
                                </Tooltip>
                            )}

                            <div style={{ display: "flex", flexDirection: "column", maxWidth: "calc(100% - 40px)" }}>
                                {!isMe && (
                                    <div className={classes.displayName}>
                                        {ticket?.contact?.name?.split(" ")[0]}
                                        {ticket?.contact?.secondaryNumber && (
                                            <Tooltip title="Contato com múltiplos números (Mesclado)">
                                                <CallMerge style={{ fontSize: 14, marginLeft: 4, color: "#757575" }} />
                                            </Tooltip>
                                        )}
                                    </div>
                                )}

                                <div
                                    className={isMe ? classes.messageRight : classes.messageLeft}
                                    title={message.queueId && message.queue?.name}
                                    onDoubleClick={(e) => hanldeReplyMessage(e, message)}
                                >
                                    {showSelectMessageCheckbox && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                left: isMe ? -30 : "auto",
                                                right: isMe ? "auto" : -30,
                                                top: 0,
                                            }}
                                        >
                                            <SelectMessageCheckbox message={message} />
                                        </div>
                                    )}

                                    <IconButton
                                        variant="contained"
                                        size="small"
                                        id="messageActionsButton"
                                        disabled={message.isDeleted}
                                        className={classes.messageActionsButton}
                                        onClick={(e) => handleOpenMessageOptionsMenu(e, message)}
                                    >
                                        <ExpandMore />
                                    </IconButton>

                                    {message.isForwarded && (
                                        <div
                                            style={{
                                                fontSize: 11,
                                                fontStyle: "italic",
                                                display: "flex",
                                                alignItems: "center",
                                                marginBottom: 4,
                                                opacity: 0.8,
                                            }}
                                        >
                                            <Reply style={{ fontSize: 14, transform: "scaleX(-1)", marginRight: 4 }} />{" "}
                                            Encaminhada
                                        </div>
                                    )}

                                    {isGroup && !isMe && (
                                        <Typography
                                            variant="caption"
                                            style={{
                                                fontWeight: "bold",
                                                color: "#10B981",
                                                display: "block",
                                                marginBottom: 2,
                                            }}
                                        >
                                            {message.contact?.name}
                                        </Typography>
                                    )}

                                    {message.isDeleted && (
                                        <div style={{ fontStyle: "italic", opacity: 0.6, fontSize: 13 }}>
                                            <Block
                                                fontSize="small"
                                                style={{ verticalAlign: "middle", marginRight: 4 }}
                                            />
                                            Mensagem apagada
                                        </div>
                                    )}

                                    {checkMessageMedia(message)}

                                    <div
                                        className={
                                            message.isEdited ? classes.textContentItemEdited : classes.textContentItem
                                        }
                                    >
                                        {message.quotedMsg && renderQuotedMessage(message)}

                                        {message.mediaType === "reactionMessage" ? (
                                            <div className={classes.reactionMessage}>
                                                {`${message.contact?.name || "Contato"} reagiu com ${message.body}`}
                                            </div>
                                        ) : (
                                            <MarkdownWrapper>
                                                {["locationMessage", "contactMessage"].includes(message.mediaType)
                                                    ? null
                                                    : message.mediaUrl &&
                                                        !["image", "audio", "video"].includes(message.mediaType)
                                                      ? message.body !== message.mediaUrl.split("/").pop()
                                                          ? message.body
                                                          : null
                                                      : message.body}
                                            </MarkdownWrapper>
                                        )}

                                        {message.reactions && message.reactions.length > 0 && (
                                            <div className={classes.reactionsContainer}>
                                                {message.reactions.map((reaction, i) => (
                                                    <span key={i} className={classes.reactionBadge}>
                                                        {reaction.body || reaction.value || reaction.emoji}
                                                        {reaction.count > 1 ? ` ${reaction.count}` : ""}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className={classes.timestamp}>
                                            {message.isEdited && <span>Editada</span>}
                                            <span>{format(parseISO(message.createdAt), "HH:mm")}</span>
                                            {isMe && renderMessageAck(message)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {isMe && (
                                <Avatar
                                    className={classes.avatar}
                                    src={user?.profileImage || undefined}
                                    alt={user?.name}
                                >
                                    <PersonIcon />
                                </Avatar>
                            )}
                        </div>
                    </React.Fragment>
                );
            });
            return viewMessagesList;
        } else {
            return (
                <div style={{ textAlign: "center", padding: 20, color: "#9CA3AF" }}>
                    Diga olá para seu novo contato! 👋
                </div>
            );
        }
    };

    return (
        <div className={classes.messagesListWrapper}>
            <MessageOptionsMenu
                message={selectedMessage}
                anchorEl={anchorEl}
                menuOpen={messageOptionsMenuOpen}
                handleClose={handleCloseMessageOptionsMenu}
            />
            <div id="messagesList" className={classes.messagesList} onScroll={handleScroll}>
                {messagesList.length > 0 ? renderMessages() : []}
            </div>
            {loading && <CircularProgress size={24} className={classes.circleLoading} />}
        </div>
    );
};

export default MessagesList;
