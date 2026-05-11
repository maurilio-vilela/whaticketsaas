import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import TicketHeaderSkeleton from "../TicketHeaderSkeleton";

const useStyles = makeStyles((theme) => ({
    ticketHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between", // Separa Info (Esq) dos Botões (Dir)
        minHeight: "64px", // Altura padrão de Toolbar
        padding: theme.spacing(0, 2),
        backgroundColor: theme.palette.background.paper, // Usa a cor do tema
        borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
        flex: "none",
        [theme.breakpoints.down("xs")]: {
            flexWrap: "wrap",
            padding: theme.spacing(1),
            justifyContent: "center", // Centraliza em telas muito pequenas
            gap: theme.spacing(1),
        },
    },
    // Classe para garantir que os botões (children) fiquem alinhados
    actionsContainer: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(1), // Espaçamento entre os botões
        [theme.breakpoints.down("xs")]: {
            width: "100%",
            justifyContent: "space-around", // Distribui botões no mobile
        },
    },
}));

const TicketHeader = ({ loading, children }) => {
    const classes = useStyles();

    if (loading) return <TicketHeaderSkeleton />;

    return (
        <Paper square elevation={0} className={classes.ticketHeader}>
            {/* Os filhos (TicketInfo e Botões) serão organizados pelo CSS do pai ou classes internas */}
            {children}
        </Paper>
    );
};

export default TicketHeader;
