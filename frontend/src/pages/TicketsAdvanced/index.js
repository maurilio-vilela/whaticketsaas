import React, { useState, useEffect, useContext } from "react";
import { useParams, useHistory } from "react-router-dom";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Box from "@material-ui/core/Box";
import BottomNavigation from "@material-ui/core/BottomNavigation";
import BottomNavigationAction from "@material-ui/core/BottomNavigationAction";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper"; // Importado Paper

// Ícones
import QuestionAnswerIcon from "@material-ui/icons/QuestionAnswer";
import ChatIcon from "@material-ui/icons/Chat";
import ChatBubbleOutlineIcon from "@material-ui/icons/ChatBubbleOutline";

import TicketsManagerTabs from "../../components/TicketsManagerTabs/";
import Ticket from "../../components/Ticket/";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import { AuthContext } from "../../context/Auth/AuthContext";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles((theme) => ({
    root: {
        height: "92.5vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden", // Impede scroll na raiz
        backgroundColor: theme.palette.background.default,
    },
    header: {
        width: "100%",
        flex: "0 0 auto", // Não encolhe nem estica
    },
    content: {
        flex: 1, // Ocupa todo o espaço restante
        overflowY: "hidden", // Deixa o componente filho gerenciar o scroll
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100%", // Garante altura para os filhos
    },
    navigation: {
        backgroundColor: theme.palette.background.paper,
        display: "flex",
        justifyContent: "space-around",
        borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
    },
    // --- ESTILOS DO PLACEHOLDER ---
    welcomeMsg: {
        backgroundColor: theme.palette.welcomeMsgBackground,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        textAlign: "center",
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

const TicketAdvanced = (props) => {
    const classes = useStyles();
    const theme = useTheme();
    const { ticketId } = useParams();
    const history = useHistory();

    // 0 = Chat (Ticket), 1 = Lista (Atendimentos)
    const [option, setOption] = useState(0);

    const { currentTicket, setCurrentTicket } = useContext(TicketsContext);
    const { user } = useContext(AuthContext);

    // Efeito para selecionar a aba correta ao carregar ou mudar URL
    useEffect(() => {
        if (ticketId) {
            setOption(0); // Tem ID, vai pro Chat
        } else {
            setOption(1); // Não tem ID, vai pra Lista
        }
    }, [ticketId]);

    // Efeito para atualizar o contexto global de tickets
    useEffect(() => {
        if (currentTicket.id !== null) {
            // setCurrentTicket({ id: currentTicket.id, code: '#open' });
        }
        return () => {
            // Limpeza ao desmontar
            setCurrentTicket({ id: null, code: null });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const renderPlaceholder = () => {
        return (
            <Box className={classes.welcomeMsg}>
                <div className={classes.welcomeContainer}>
                    <ChatBubbleOutlineIcon className={classes.illustrationIcon} />

                    <Typography variant="h5" className={classes.welcomeTitle}>
                        Olá, {user?.name || "Usuário"}!
                    </Typography>

                    <Typography variant="body1" className={classes.welcomeSub}>
                        Nenhum atendimento selecionado.
                    </Typography>

                    <Button
                        onClick={() => setOption(1)}
                        variant="contained"
                        color="primary"
                        style={{ marginTop: 15, borderRadius: 8, padding: "10px 20px" }}
                    >
                        Ver Lista de Atendimentos
                    </Button>
                </div>
            </Box>
        );
    };

    const renderMessageContext = () => {
        if (ticketId) {
            return <Ticket />;
        }
        return renderPlaceholder();
    };

    const renderTicketsManagerTabs = () => {
        return <TicketsManagerTabs />;
    };

    return (
        // Removemos o TicketAdvancedLayout para ter controle total do flexbox
        <div className={classes.root}>
            {/* Navegação Superior Fixa */}
            <Box className={classes.header}>
                <BottomNavigation
                    value={option}
                    onChange={(event, newValue) => {
                        setOption(newValue);
                    }}
                    showLabels
                    className={classes.navigation}
                >
                    <BottomNavigationAction label="Ticket Atual" icon={<ChatIcon />} />
                    <BottomNavigationAction label="Atendimentos" icon={<QuestionAnswerIcon />} />
                </BottomNavigation>
            </Box>

            {/* Conteúdo com Scroll Independente */}
            <Box className={classes.content}>{option === 0 ? renderMessageContext() : renderTicketsManagerTabs()}</Box>
        </div>
    );
};

export default TicketAdvanced;
