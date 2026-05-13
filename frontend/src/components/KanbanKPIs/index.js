import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Assessment, ThumbDown, MonetizationOn, AttachMoney, TrendingUp } from "@material-ui/icons";

const useStyles = makeStyles((theme) => ({
    kpiContainer: {
        display: "flex",
        gap: "15px",
        marginBottom: "20px",
        overflowX: "auto",
        paddingBottom: "10px",
        [theme.breakpoints.down("sm")]: {
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "8px",
            marginBottom: "14px",
            overflowX: "visible",
            paddingBottom: 0,
        },
        "&::-webkit-scrollbar": {
            height: "6px",
        },
        "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#ccc",
            borderRadius: "4px",
        },
    },
    kpiCard: {
        backgroundColor: theme.palette.background.paper,
        borderRadius: "12px",
        padding: "16px",
        minWidth: "220px",
        display: "flex",
        alignItems: "center",
        gap: "15px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
        flex: "1 1 auto",
        transition: "transform 0.2s ease",
        [theme.breakpoints.down("sm")]: {
            padding: "10px",
            minWidth: "unset",
            width: "100%",
            gap: "10px",
        },
        "&:hover": {
            transform: "translateY(-3px)",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        },
    },
    kpiIconBox: {
        width: "48px",
        height: "48px",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        [theme.breakpoints.down("sm")]: {
            width: "40px",
            height: "40px",
            borderRadius: "10px",
        },
    },
    kpiContent: {
        display: "flex",
        flexDirection: "column",
    },
    kpiLabel: {
        fontSize: "0.78rem",
        color: theme.palette.text.secondary,
        fontWeight: "500",
        marginBottom: "4px",
        [theme.breakpoints.down("sm")]: {
            fontSize: "0.72rem",
        },
    },
    kpiValue: {
        fontSize: "1.2rem",
        fontWeight: "700",
        color: theme.palette.text.primary,
        lineHeight: 1.2,
        [theme.breakpoints.down("sm")]: {
            fontSize: "1rem",
        },
    },
    kpiSub: {
        fontSize: "0.7rem",
        color: theme.palette.text.hint,
        marginTop: "4px",
        [theme.breakpoints.down("sm")]: {
            fontSize: "0.65rem",
        },
    },
}));

export const formatBRL = (value) => {
    const numeric = Number(value || 0);
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number.isFinite(numeric) ? numeric : 0);
};

const KpiCard = ({ icon, color, label, value, sub, visible, classes }) => {
    return (
        <div className={classes.kpiCard}>
            <div className={classes.kpiIconBox} style={{ backgroundColor: `${color}20`, color: color }}>
                {icon}
            </div>
            <div className={classes.kpiContent}>
                <span className={classes.kpiLabel}>{label}</span>
                <span className={classes.kpiValue}>{visible ? value : "••••••"}</span>
                <span className={classes.kpiSub}>{sub}</span>
            </div>
        </div>
    );
};

const KanbanKPIs = ({ kpiData, showValues, isMobile }) => {
    const classes = useStyles();

    return (
        <div className={classes.kpiContainer}>
            <KpiCard
                classes={classes}
                icon={<Assessment />}
                color="#3B82F6"
                label="Oportunidades Ativas"
                value={kpiData.activeDealsCount}
                sub="Em negociação"
                visible={true}
            />
            {!isMobile && (
                <>
                    <KpiCard
                        classes={classes}
                        icon={<MonetizationOn />}
                        color="#10B981"
                        label="Vendas Ganhas"
                        value={kpiData.wonDealsCount}
                        sub={formatBRL(kpiData.wonDealsValue)}
                        visible={showValues}
                    />
                    <KpiCard
                        classes={classes}
                        icon={<ThumbDown />}
                        color="#EF4444"
                        label="Vendas Perdidas"
                        value={kpiData.lostDealsCount}
                        sub={formatBRL(kpiData.lostDealsValue)}
                        visible={showValues}
                    />
                </>
            )}
            <KpiCard
                classes={classes}
                icon={<AttachMoney />}
                color="#14B8A6"
                label="Valor Ganho"
                value={formatBRL(kpiData.wonDealsValue)}
                sub="Total fechado"
                visible={showValues}
            />
            {!isMobile && (
                <>
                    <KpiCard
                        classes={classes}
                        icon={<AttachMoney />}
                        color="#F43F5E"
                        label="Valor Perdido"
                        value={formatBRL(kpiData.lostDealsValue)}
                        sub="Total perdido"
                        visible={showValues}
                    />
                </>
            )}
            <KpiCard
                classes={classes}
                icon={<TrendingUp />}
                color="#F97316"
                label="Taxa Conversão"
                value={`${kpiData.conversionRate.toFixed(1)}%`}
                sub="Ganhas / Total"
                visible={true}
            />
            <KpiCard
                classes={classes}
                icon={<AttachMoney />}
                color="#F59E0B"
                label="Ticket Médio"
                value={formatBRL(kpiData.averageTicket)}
                sub="Valor Médio por Venda"
                visible={showValues}
            />
        </div>
    );
};

export default KanbanKPIs;
