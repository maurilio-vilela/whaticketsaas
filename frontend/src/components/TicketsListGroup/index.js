import React, { useState, useEffect, useReducer, useContext } from "react";
import { makeStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import Paper from "@material-ui/core/Paper";

import TicketListItem from "../TicketListItemCustom";
import TicketsListSkeleton from "../TicketsListSkeleton";
import useTickets from "../../hooks/useTickets";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import { SocketContext } from "../../context/Socket/SocketContext";

const useStyles = makeStyles((theme) => ({
    ticketsListWrapper: {
        position: "relative",
        display: "flex",
        height: "100%",
        flexDirection: "column",
        overflow: "hidden",
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
    },
    ticketsList: {
        flex: 1,
        maxHeight: "100%",
        overflowY: "scroll",
        ...theme.scrollbarStyles,
        borderTop: "2px solid rgba(0, 0, 0, 0.12)",
    },
    ticketsListHeader: {
        color: "rgb(67, 83, 105)",
        zIndex: 2,
        backgroundColor: "white",
        borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    },
    ticketsCount: { fontWeight: "normal", color: "rgb(104, 121, 146)", marginLeft: "8px", fontSize: "14px" },
    noTicketsText: { textAlign: "center", color: "rgb(104, 121, 146)", fontSize: "14px", lineHeight: "1.4" },
    noTicketsTitle: { textAlign: "center", fontSize: "16px", fontWeight: "600", margin: "0px" },
    noTicketsDiv: {
        display: "flex",
        height: "100px",
        margin: 40,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
    },
}));

const reducer = (state, action) => {
    if (action.type === "LOAD_TICKETS") {
        const newTickets = action.payload;
        let newState = [...state];
        newTickets.forEach((ticket) => {
            const ticketIndex = newState.findIndex((t) => t.id === ticket.id);
            if (ticketIndex !== -1) {
                newState[ticketIndex] = ticket;
                if (ticket.unreadMessages > 0) {
                    newState.unshift(newState.splice(ticketIndex, 1)[0]);
                }
            } else {
                newState.push(ticket);
            }
        });
        return newState;
    }
    if (action.type === "RESET_UNREAD") {
        const ticketId = action.payload;
        const ticketIndex = state.findIndex((t) => t.id === ticketId);
        if (ticketIndex !== -1) {
            const newState = [...state];
            newState[ticketIndex] = { ...newState[ticketIndex], unreadMessages: 0 };
            return newState;
        }
        return state;
    }
    if (action.type === "UPDATE_TICKET") {
        const ticket = action.payload;
        const ticketIndex = state.findIndex((t) => t.id === ticket.id);
        if (ticketIndex !== -1) {
            const newState = [...state];
            newState[ticketIndex] = ticket;
            return newState;
        } else {
            return [ticket, ...state];
        }
    }
    if (action.type === "UPDATE_TICKET_UNREAD_MESSAGES") {
        const ticket = action.payload;
        const ticketIndex = state.findIndex((t) => t.id === ticket.id);
        if (ticketIndex !== -1) {
            const newState = [...state];
            newState[ticketIndex] = ticket;
            newState.unshift(newState.splice(ticketIndex, 1)[0]);
            return newState;
        } else {
            return [ticket, ...state];
        }
    }
    if (action.type === "UPDATE_TICKET_CONTACT") {
        const contact = action.payload;
        const ticketIndex = state.findIndex((t) => t.contactId === contact.id);
        if (ticketIndex !== -1) {
            const newState = [...state];
            newState[ticketIndex].contact = contact;
            return newState;
        }
        return state;
    }
    if (action.type === "DELETE_TICKET") {
        const ticketId = action.payload;
        return state.filter((t) => t.id !== ticketId);
    }
    if (action.type === "RESET") {
        return [];
    }
    return state;
};

const TicketsListGroup = (props) => {
    const { status, searchParam, tags, users, showAll, selectedQueueIds, updateCount, style } = props;
    const classes = useStyles();
    const [pageNumber, setPageNumber] = useState(1);
    const [ticketsList, dispatch] = useReducer(reducer, []);
    const socketManager = useContext(SocketContext);
    const { user } = useContext(AuthContext);
    const { profile, queues } = user;

    useEffect(() => {
        dispatch({ type: "RESET" });
        setPageNumber(1);
    }, [status, searchParam, dispatch, showAll, tags, users, selectedQueueIds]);

    const { tickets, hasMore, loading } = useTickets({
        pageNumber,
        searchParam,
        status,
        showAll,
        tags: JSON.stringify(tags),
        users: JSON.stringify(users),
        queueIds: JSON.stringify(selectedQueueIds),
    });

    useEffect(() => {
        const queueIds = queues.map((q) => q.id);
        const filteredTickets = tickets.filter((t) => queueIds.indexOf(t.queueId) > -1);
        if (profile === "user") {
            dispatch({ type: "LOAD_TICKETS", payload: filteredTickets });
        } else {
            dispatch({ type: "LOAD_TICKETS", payload: tickets });
        }
    }, [tickets, status, searchParam, queues, profile]);

    useEffect(() => {
        const companyId = localStorage.getItem("companyId");
        const socket = socketManager.getSocket(companyId);

        // 1ª CAMADA DE BLINDAGEM: Socket
        const shouldUpdateTicket = (ticket) => {
            const belongsToUser = !ticket.userId || ticket.userId === user?.id || showAll;
            const belongsToSelectedQueue =
                selectedQueueIds.length === 0 ||
                selectedQueueIds.includes(ticket.queueId) ||
                (ticket.queueId === null && profile !== "user");

            return belongsToUser && belongsToSelectedQueue;
        };

        const notBelongsToUserQueues = (ticket) => {
            if (selectedQueueIds.length === 0) return false;
            return ticket.queueId && !selectedQueueIds.includes(ticket.queueId);
        };

        const handleReady = () => {
            if (status) {
                socket.emit("joinTickets", status);
            } else {
                socket.emit("joinNotification");
            }
        };

        const handleTicket = (data) => {
            if (data.action === "updateUnread") dispatch({ type: "RESET_UNREAD", payload: data.ticketId });
            if (data.action === "update" && !data.ticket) return;

            if (data.action === "update" && shouldUpdateTicket(data.ticket) && data.ticket.status === status) {
                dispatch({ type: "UPDATE_TICKET", payload: data.ticket });
            }
            if (data.action === "update" && notBelongsToUserQueues(data.ticket)) {
                dispatch({ type: "DELETE_TICKET", payload: data.ticket.id });
            }
            if (data.action === "delete") {
                dispatch({ type: "DELETE_TICKET", payload: data.ticketId });
            }
        };

        const handleAppMessage = (data) => {
            if (!data.ticket) return;
            const queueIds = queues.map((q) => q.id);
            if (profile === "user" && (queueIds.indexOf(data.ticket.queue?.id) === -1 || data.ticket.queue === null))
                return;

            if (data.action === "create" && shouldUpdateTicket(data.ticket)) {
                if (!status || status === "all" || data.ticket.status === status) {
                    dispatch({ type: "UPDATE_TICKET_UNREAD_MESSAGES", payload: data.ticket });
                }
            }
        };

        const handlePresence = (data) => dispatch({ type: "UPDATE_TICKET_PRESENCE", payload: data });
        const handleContact = (data) => {
            if (data.action === "update") dispatch({ type: "UPDATE_TICKET_CONTACT", payload: data.contact });
        };

        socket.on("ready", handleReady);
        socket.on(`company-${companyId}-ticket`, handleTicket);
        socket.on(`company-${companyId}-appMessage`, handleAppMessage);
        socket.on(`company-${companyId}-presence`, handlePresence);
        socket.on(`company-${companyId}-contact`, handleContact);

        return () => {
            socket.off("ready", handleReady);
            socket.off(`company-${companyId}-ticket`, handleTicket);
            socket.off(`company-${companyId}-appMessage`, handleAppMessage);
            socket.off(`company-${companyId}-presence`, handlePresence);
            socket.off(`company-${companyId}-contact`, handleContact);
        };
    }, [status, showAll, user, selectedQueueIds, tags, users, profile, queues, socketManager]);

    useEffect(() => {
        const count = ticketsList.filter((ticket) => ticket.isGroup).length;
        if (typeof updateCount === "function") updateCount(count);
    }, [ticketsList, updateCount]);

    const loadMore = () => setPageNumber((prevState) => prevState + 1);
    const handleScroll = (e) => {
        if (!hasMore || loading) return;
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - (scrollTop + 100) < clientHeight) loadMore();
    };

    // 2ª CAMADA DE BLINDAGEM: Filtro Visual de Renderização
    let filteredTicketsList = ticketsList.filter((ticket) => ticket.isGroup.toString() === "true");

    if (status) {
        filteredTicketsList = filteredTicketsList.filter((ticket) => ticket?.status === status);
    }

    if (selectedQueueIds.length > 0) {
        filteredTicketsList = filteredTicketsList.filter((ticket) => {
            if (profile === "user") {
                return selectedQueueIds.includes(ticket?.queueId);
            } else {
                return selectedQueueIds.includes(ticket?.queueId) || ticket?.queueId === null;
            }
        });
    }

    return (
        <Paper className={classes.ticketsListWrapper} style={style}>
            <Paper square name="closed" elevation={0} className={classes.ticketsList} onScroll={handleScroll}>
                <List style={{ paddingTop: 0 }}>
                    {filteredTicketsList.length === 0 && !loading ? (
                        <div className={classes.noTicketsDiv}>
                            <span className={classes.noTicketsTitle}>{i18n.t("ticketsList.noTicketsTitle")}</span>
                            <p className={classes.noTicketsText}>{i18n.t("ticketsList.noTicketsMessage")}</p>
                        </div>
                    ) : (
                        <>
                            {filteredTicketsList.map((ticket) => (
                                <TicketListItem ticket={ticket} key={ticket.id} />
                            ))}
                        </>
                    )}
                    {loading && <TicketsListSkeleton />}
                </List>
            </Paper>
        </Paper>
    );
};

export default TicketsListGroup;
