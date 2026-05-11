import React, { useContext } from "react";
import { useParams } from "react-router-dom";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import ChatBubbleOutlineIcon from "@material-ui/icons/ChatBubbleOutline";

import TicketsManager from "../../components/TicketsManagerTabs/";
import Ticket from "../../components/Ticket/";
import { AuthContext } from "../../context/Auth/AuthContext";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles((theme) => ({
    root: {
        display: "flex",
        height: "92.5vh",
        position: "relative",
        overflow: "hidden",
    },
    mainPaper: {
        flex: 1,
        height: "92.5vh",
        display: "flex",
        borderRadius: 0,
        backgroundColor: theme.palette.background.default,
        overflow: "hidden",
    },
    contactsWrapper: {
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflowY: "hidden",
        borderRight: "1px solid rgba(0, 0, 0, 0.12)",
        [theme.breakpoints.down("sm")]: {
            width: "100%",
            borderRight: "none",
        },
    },
    messagesWrapper: {
        height: "100%",
        display: "flex",
        flexDirection: "column",
        [theme.breakpoints.down("sm")]: {
            width: "100%",
        },
    },
    // Classes utilitárias para controle Mobile
    hideOnMobile: {
        [theme.breakpoints.down("sm")]: {
            display: "none !important",
        },
    },
    // --- ESTILOS DO PLACEHOLDER PROFISSIONAL ---
    welcomeMsg: {
        backgroundColor: theme.palette.welcomeMsgBackground,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        textAlign: "center",
        borderLeft: "1px solid rgba(0, 0, 0, 0.12)",
        padding: 20,
        userSelect: "none",
    },
    welcomeContainer: {
        maxWidth: 450,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
    },
    illustrationIcon: {
        fontSize: 100,
        color: theme.palette.primary.main,
        opacity: 0.15,
        marginBottom: 10,
    },
    welcomeTitle: {
        fontWeight: 700,
        color: theme.palette.text.primary,
        fontSize: "1.5rem",
    },
    welcomeSub: {
        color: theme.palette.text.secondary,
        fontSize: "1rem",
        lineHeight: 1.6,
    },
}));

const TicketsCustom = () => {
    const classes = useStyles();
    const theme = useTheme();
    const { ticketId } = useParams();
    const { user } = useContext(AuthContext); // Contexto para pegar o nome do usuário

    // Hook para detectar mobile
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    return (
        <div className={classes.root}>
            <Paper className={classes.mainPaper} elevation={0}>
                <Grid container spacing={0} style={{ height: "100%" }}>
                    {/* COLUNA DA ESQUERDA (Lista de Tickets/Abas) */}
                    <Grid
                        item
                        xs={12}
                        md={3}
                        className={`
                            ${classes.contactsWrapper} 
                            ${ticketId && isMobile ? classes.hideOnMobile : ""}
                        `}
                    >
                        <TicketsManager />
                    </Grid>

                    {/* COLUNA DA DIREITA (Chat / Mensagens) */}
                    <Grid
                        item
                        xs={12}
                        md={9}
                        className={`
                            ${classes.messagesWrapper}
                            ${!ticketId && isMobile ? classes.hideOnMobile : ""}
                        `}
                    >
                        {ticketId ? (
                            <Ticket />
                        ) : (
                            // TELA DE BOAS VINDAS (Placeholder)
                            <div className={`${classes.welcomeMsg} ${isMobile ? classes.hideOnMobile : ""}`}>
                                <div className={classes.welcomeContainer}>
                                    <ChatBubbleOutlineIcon className={classes.illustrationIcon} />

                                    <Typography variant="h5" className={classes.welcomeTitle}>
                                        Olá, {user?.name || "Usuário"}!
                                    </Typography>

                                    <Typography variant="body1" className={classes.welcomeSub}>
                                        Selecione ou inicie um atendimento na lista ao lado para começar.
                                    </Typography>
                                </div>
                            </div>
                        )}
                    </Grid>
                </Grid>
            </Paper>
        </div>
    );
};

export default TicketsCustom;
