import { Avatar, makeStyles, Tooltip, Typography } from "@material-ui/core";
import React, { useState } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import ContactManagementModal from "../../ContactManagementModal";

const useStyles = makeStyles((theme) => ({
    cardContainer: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        position: "relative",
    },
    headerRow: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        width: "100%",
        marginBottom: "8px",
    },
    leftSide: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        maxWidth: "75%",
        overflow: "hidden",
    },
    avatar: {
        width: "40px",
        height: "40px",
        border: `1px solid ${theme.palette.divider}`,
        cursor: "pointer",
    },
    infoStack: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        overflow: "hidden",
    },
    name: {
        fontWeight: "700",
        fontSize: "14px",
        color: theme.palette.text.primary,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        lineHeight: "1.2",
        cursor: "pointer",
        "&:hover": {
            textDecoration: "underline",
        },
    },
    number: {
        fontSize: "11px",
        color: theme.palette.text.secondary,
        marginTop: "2px",
    },
    date: {
        fontSize: "10px",
        color: "#9ca3af",
        fontWeight: "500",
        whiteSpace: "nowrap",
        marginTop: "2px",
    },
    // Rodapé do Card (Onde fica o valor)
    footerRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start", // ALINHADO A ESQUERDA
        marginTop: "4px",
    },
    dealValueBadge: {
        display: "inline-flex",
        alignItems: "center",
        backgroundColor: theme.palette.mode === "dark" ? "rgba(0, 168, 132, 0.2)" : "#E0F2F1",
        color: theme.palette.mode === "dark" ? "#4db6ac" : "#00695C",
        padding: "2px 6px",
        marginBottom: "5px",
        borderRadius: "4px",
        fontSize: "10px",
        fontWeight: "bold",
        border: `1px solid ${theme.palette.mode === "dark" ? "rgba(0, 168, 132, 0.3)" : "transparent"}`,
        cursor: "pointer",
        transition: "0.2s",
        "&:hover": {
            filter: "brightness(1.1)",
        },
    },
}));

const formatCurrency = (value) => {
    const numberValue = parseFloat(value) || 0;
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(numberValue);
};

const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = parseISO(dateString);
    if (isSameDay(date, new Date())) {
        return format(date, "HH:mm");
    }
    return format(date, "dd/MM");
};

const CardTitle = ({ ticket, onEditValue }) => {
    const classes = useStyles();
    const [contactModalOpen, setContactModalOpen] = useState(false);

    const handleOpenContactModal = (e) => {
        e.stopPropagation();
        setContactModalOpen(true);
    };

    return (
        <>
            <ContactManagementModal
                open={contactModalOpen}
                onClose={() => setContactModalOpen(false)}
                contactId={ticket.contact.id}
            />

            <div className={classes.cardContainer}>
                {/* TOPO: Avatar + Info + Data */}
                <div className={classes.headerRow}>
                    <div className={classes.leftSide}>
                        <Avatar
                            className={classes.avatar}
                            src={ticket.contact.profilePicUrl}
                            alt={ticket.contact.name}
                            onClick={handleOpenContactModal}
                        />
                        <div className={classes.infoStack}>
                            <Typography className={classes.name} onClick={handleOpenContactModal}>
                                {ticket.contact.name}
                            </Typography>
                            <Typography className={classes.number}>{ticket.contact.number}</Typography>
                        </div>
                    </div>

                    <span className={classes.date}>{formatDate(ticket.updatedAt)}</span>
                </div>

                {/* RODAPÉ: Apenas o Valor à Esquerda */}
                <div className={classes.footerRow}>
                    <Tooltip title="Editar Valor">
                        <div
                            className={classes.dealValueBadge}
                            onClick={(e) => {
                                e.stopPropagation();
                                onEditValue();
                            }}
                        >
                            {formatCurrency(ticket.dealValue)}
                        </div>
                    </Tooltip>
                </div>
            </div>
        </>
    );
};

export default CardTitle;
