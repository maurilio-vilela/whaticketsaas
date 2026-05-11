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
    },
    kpiContent: {
        display: "flex",
        flexDirection: "column",
    },
    kpiLabel: {
        fontSize: "0.85rem",
        color: theme.palette.text.secondary,
        fontWeight: "500",
        marginBottom: "4px",
    },
    kpiValue: {
        fontSize: "1.4rem",
        fontWeight: "700",
        color: theme.palette.text.primary,
        lineHeight: 1.2,
    },
    kpiSub: {
        fontSize: "0.75rem",
        color: theme.palette.text.hint,
        marginTop: "4px",
    },
}));

export const formatBRL = (value) => {
    let v = String(value || 0).replace(/\D/g, "");
    v = (v / 100).toFixed(2) + "";
    v = v.replace(".", ",");
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    return v;
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
