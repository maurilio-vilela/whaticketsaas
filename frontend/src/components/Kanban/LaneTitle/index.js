import React from "react";
import { makeStyles, Typography } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
    container: {
        display: "flex",
        flexDirection: "column",
        marginBottom: "8px",
        position: "relative",
        width: "100%",
        padding: "0 4px", // Pequeno respiro lateral
    },
    colorBar: {
        height: "4px",
        width: "100%",
        borderRadius: "4px",
        marginBottom: "12px",
        opacity: 0.8,
    },
    headerTop: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between", // Separa Título do Badge
        marginBottom: "2px",
    },
    title: {
        fontWeight: "800",
        fontSize: "13px", // Levemente menor para caber mais texto
        textTransform: "uppercase",
        color: theme.palette.text.secondary,
        letterSpacing: "0.5px",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: "70%",
    },
    totalValue: {
        fontSize: "11px",
        fontWeight: "600",
        color: theme.palette.text.disabled,
        alignSelf: "flex-end", // Alinha valor à direita
    },
    countBadge: {
        fontSize: "10px",
        fontWeight: "bold",
        backgroundColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "#E0E0E0",
        color: theme.palette.text.primary,
        padding: "2px 8px",
        borderRadius: "10px",
        minWidth: "20px",
        textAlign: "center",
    },
}));

const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
};

const LaneTitle = ({ squareColor, firstLane, children, quantity, totalValue }) => {
    const classes = useStyles();
    const barColor = firstLane ? (theme) => theme.palette.grey[500] : squareColor || "#ccc";

    return (
        <div className={classes.container}>
            <div className={classes.colorBar} style={{ backgroundColor: barColor }}></div>

            <div className={classes.headerTop}>
                <Typography className={classes.title} title={children}>
                    {children}
                </Typography>
                <span className={classes.countBadge}>{quantity}</span>
            </div>

            <div className={classes.totalValue}>Total: {formatCurrency(totalValue)}</div>
        </div>
    );
};

export default LaneTitle;
