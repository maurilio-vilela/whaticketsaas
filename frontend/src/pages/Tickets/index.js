import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography"; // Adicionado
import useMediaQuery from "@material-ui/core/useMediaQuery";
import ChatBubbleOutlineIcon from "@material-ui/icons/ChatBubbleOutline"; // Ícone para ilustração

import TicketsManager from "../../components/TicketsManager/";
import Ticket from "../../components/Ticket/";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext"; // Importando contexto de Auth

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
    hideOnMobile: {
        [theme.breakpoints.down("sm")]: {
            display: "none !important",
        },
    },
    showOnMobile: {
        [theme.breakpoints.down("sm")]: {
            display: "flex !important",
        },
    },
    // --- ESTILOS DO WELCOME MODERNIZADOS ---
    welcomeMsg: {
        backgroundColor: theme.palette.type === "light" ? "#F8FAFC" : "#111827", // Fundo mais suave/moderno
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
    logoStyle: {
        width: "100%",
        maxWidth: 180, // Logo menor e mais discreto
        height: "auto",
        objectFit: "contain",
        marginBottom: 20,
        opacity: 0.9,
    },
    illustrationIcon: {
        fontSize: 100, // Ícone gigante
        color: theme.palette.primary.main,
        opacity: 0.15, // Bem sutil no fundo
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

const Chat = () => {
    const classes = useStyles();
    const theme = useTheme();
    const { ticketId } = useParams();
    const { user } = useContext(AuthContext); // Pegando dados do usuário logado

    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const [logoImg, setLogoImg] = useState(
        `${process.env.REACT_APP_BACKEND_URL}/public/logotipos/interno.png`
    );

    useEffect(() => {
        const logoLight = `${process.env.REACT_APP_BACKEND_URL}/public/logotipos/interno.png`;
        const logoDark = `${process.env.REACT_APP_BACKEND_URL}/public/logotipos/logo_w.png`;
        setLogoImg(theme.palette.type === "light" ? logoLight : logoDark);
    }, [theme.palette.type]);

    return (
        <div className={classes.root}>
            <Paper className={classes.mainPaper} elevation={0}>
                <Grid container spacing={0} style={{ height: "100%" }}>
                    {/* LISTA DE CONTATOS */}
                    <Grid
                        item
                        xs={12}
                        md={4}
                        className={`
                            ${classes.contactsWrapper} 
                            ${ticketId && isMobile ? classes.hideOnMobile : ""}
                        `}
                    >
                        <TicketsManager />
                    </Grid>

                    {/* ÁREA DE MENSAGENS */}
                    <Grid
                        item
                        xs={12}
                        md={8}
                        className={`
                            ${classes.messagesWrapper}
                            ${!ticketId && isMobile ? classes.hideOnMobile : ""}
                        `}
                    >
                        {ticketId ? (
                            <Ticket />
                        ) : (
                            // --- TELA DE BOAS VINDAS PROFISSIONAL ---
                            <div className={`${classes.welcomeMsg} ${isMobile ? classes.hideOnMobile : ""}`}>
                                <div className={classes.welcomeContainer}>
                                    {/* Opção 1: Ilustração com ícone (Fica muito clean) */}
                                    <ChatBubbleOutlineIcon className={classes.illustrationIcon} />

                                    {/* Ou Opção 2: Logo da empresa (Descomente se preferir o logo) */}
                                    {/* <img
                                        className={classes.logoStyle}
                                        src={`${logoImg}?r=${Math.random()}`}
                                        alt={process.env.REACT_APP_NAME_SYSTEM}
                                    /> */}

                                    <Typography variant="h5" className={classes.welcomeTitle}>
                                        Olá, {user?.name || "Usuário"}!
                                    </Typography>

                                    <Typography variant="body1" className={classes.welcomeSub}>
                                        Selecione um contato na lista ao lado para iniciar um atendimento ou visualizar
                                        suas mensagens.
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

export default Chat;
