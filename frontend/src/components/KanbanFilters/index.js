import React from "react";
import { FormControl, InputLabel, Select, MenuItem, makeStyles } from "@material-ui/core";
import { Search } from "@material-ui/icons";

const useStyles = makeStyles((theme) => ({
    searchWrapper: {
        display: "flex",
        alignItems: "center",
        backgroundColor: theme.palette.background.paper,
        borderRadius: "8px",
        padding: "0 10px",
        border: "1px solid #E5E7EB",
        minWidth: "200px",
        height: "40px",
        [theme.breakpoints.down("sm")]: {
            minWidth: "100%",
            marginBottom: "10px",
        },
    },
    searchInput: {
        border: "none",
        outline: "none",
        marginLeft: "8px",
        width: "100%",
        fontSize: "0.9rem",
        backgroundColor: "transparent",
        color: theme.palette.text.primary,
    },
    filterSelect: {
        minWidth: "140px",
        backgroundColor: theme.palette.background.paper,
        borderRadius: "8px",
        "& .MuiOutlinedInput-root": {
            height: "40px",
            borderRadius: "8px",
        },
        [theme.breakpoints.down("sm")]: {
            minWidth: "100%",
            marginBottom: "10px",
        },
    },
}));

const KanbanFilters = ({ filter, setFilter, user, users, tags, isMobile }) => {
    const classes = useStyles();

    return (
        <>
            <div className={classes.searchWrapper}>
                <Search style={{ color: "#9CA3AF" }} />
                <input
                    className={classes.searchInput}
                    placeholder="Buscar..."
                    value={filter.search}
                    onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                />
            </div>
            <FormControl variant="outlined" className={classes.filterSelect} size="small" fullWidth={isMobile}>
                <InputLabel>Visualização</InputLabel>
                <Select
                    value={filter.visualization}
                    onChange={(e) => setFilter({ ...filter, visualization: e.target.value })}
                    label="Visualização"
                >
                    <MenuItem value="mine">Minhas Lanes</MenuItem>
                    {user.profile === "admin" && <MenuItem value="all">Todas as Lanes</MenuItem>}
                </Select>
            </FormControl>
            {filter.visualization === "all" && user.profile === "admin" && (
                <FormControl variant="outlined" className={classes.filterSelect} size="small" fullWidth={isMobile}>
                    <InputLabel>Operador</InputLabel>
                    <Select
                        value={filter.selectedUser}
                        onChange={(e) => setFilter({ ...filter, selectedUser: e.target.value })}
                        label="Operador"
                    >
                        <MenuItem value="all">Todos</MenuItem>
                        {users.map((u) => (
                            <MenuItem key={u.id} value={u.id}>
                                {u.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}
            <FormControl variant="outlined" className={classes.filterSelect} size="small" fullWidth={isMobile}>
                <InputLabel>Etapas</InputLabel>
                <Select
                    value={filter.laneId}
                    onChange={(e) => setFilter({ ...filter, laneId: e.target.value })}
                    label="Etapas"
                >
                    <MenuItem value="all">Todas</MenuItem>
                    <MenuItem value={0}>Em Aberto</MenuItem>
                    {tags.map((t) => (
                        <MenuItem key={t.id} value={t.id}>
                            {t.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <FormControl variant="outlined" className={classes.filterSelect} size="small" fullWidth={isMobile}>
                <InputLabel>Período</InputLabel>
                <Select
                    value={filter.period}
                    onChange={(e) => setFilter({ ...filter, period: e.target.value })}
                    label="Período"
                >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="today">Hoje</MenuItem>
                    <MenuItem value="week">Esta semana</MenuItem>
                    <MenuItem value="month">Este mês</MenuItem>
                </Select>
            </FormControl>
            <FormControl variant="outlined" className={classes.filterSelect} size="small" fullWidth={isMobile}>
                <InputLabel>Valor</InputLabel>
                <Select
                    value={filter.value}
                    onChange={(e) => setFilter({ ...filter, value: e.target.value })}
                    label="Valor"
                >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="high">Acima de R$ 5k</MenuItem>
                    <MenuItem value="mid">R$ 1k - 5k</MenuItem>
                    <MenuItem value="low">R$ 0 - 1k</MenuItem>
                </Select>
            </FormControl>
        </>
    );
};

export default KanbanFilters;