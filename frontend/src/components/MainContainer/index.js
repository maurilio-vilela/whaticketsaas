import React from "react";

import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";

const useStyles = makeStyles(theme => ({
    mainContainer: {
        flex: 1,
        // Adiciona um padding responsivo (menor em mobile, maior em desktop)
        padding: theme.spacing(2),
        [theme.breakpoints.down("sm")]: {
            padding: theme.spacing(1),
        },
        // Garante que o container ocupe a altura da viewport menos o cabeçalho
        height: `calc(100vh - 48px)`,
        display: "flex",
        flexDirection: "column",
    },

    contentWrapper: {
        width: "100%",
        flex: 1, // Faz o wrapper crescer para ocupar todo o espaço disponível
        display: "flex",
        flexDirection: "column",
        // Moderno: O scroll acontece AQUI dentro, não na página inteira
        overflowY: "auto", 
        overflowX: "hidden",
        // Estilização opcional da barra de rolagem para ficar mais clean
        "&::-webkit-scrollbar": {
            width: "6px",
            height: "6px",
        },
        "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(0,0,0,0.2)",
            borderRadius: "3px",
        },
    },
}));

const MainContainer = ({ children }) => {
    const classes = useStyles();

    return (
        <Container 
            className={classes.mainContainer} 
            maxWidth={false} // ISSO FAZ OCUPAR TODA A LARGURA
        >
            <div className={classes.contentWrapper}>
                {children}
            </div>
        </Container>
    );
};

export default MainContainer;