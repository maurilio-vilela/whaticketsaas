import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Avatar, Paper, Box } from "@material-ui/core";
import Skeleton from "@material-ui/lab/Skeleton";

const useStyles = makeStyles((theme) => ({
    ticketHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: "64px",
        padding: theme.spacing(0, 2),
        backgroundColor: theme.palette.background.paper,
        borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
        flex: "none",
    },
    leftSide: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(1.5),
    },
    rightSide: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(1),
    },
}));

const TicketHeaderSkeleton = () => {
    const classes = useStyles();

    return (
        <Paper square elevation={0} className={classes.ticketHeader}>
            {/* Lado Esquerdo (Info) */}
            <div className={classes.leftSide}>
                <Skeleton animation="wave" variant="circle">
                    <Avatar />
                </Skeleton>
                <Box>
                    <Skeleton animation="wave" height={20} width={120} style={{ marginBottom: 4 }} />
                    <Skeleton animation="wave" height={15} width={180} />
                </Box>
            </div>

            {/* Lado Direito (Botões) */}
            <div className={classes.rightSide}>
                <Skeleton animation="wave" variant="rect" width={40} height={40} style={{ borderRadius: 4 }} />
                <Skeleton animation="wave" variant="rect" width={40} height={40} style={{ borderRadius: 4 }} />
                <Skeleton animation="wave" variant="rect" width={100} height={40} style={{ borderRadius: 4 }} />
            </div>
        </Paper>
    );
};

export default TicketHeaderSkeleton;
