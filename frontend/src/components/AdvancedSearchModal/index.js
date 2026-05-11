import React, { useState } from "react";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    Grid,
    TextField,
    FormControl,
    Typography,
    RadioGroup,
    FormControlLabel,
    Radio,
    InputLabel,
    Select,
    MenuItem,
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    Divider,
    CircularProgress,
    makeStyles,
} from "@material-ui/core";
import {
    Search as SearchIcon,
    Close as CloseIcon,
    Person as PersonIcon,
    Message as MessageIcon,
    ArrowForwardIos as ArrowIcon,
} from "@material-ui/icons";

const useStyles = makeStyles((theme) => ({
    dialogHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: theme.palette.primary.main,
        padding: "16px 24px",
    },
    dialogTitle: {
        color: "#fff",
        fontSize: "1.2rem",
        fontWeight: "bold",
        display: "flex",
        alignItems: "center",
        gap: 8,
    },
    dialogCloseIcon: {
        color: "#fff",
    },
    resultListContainer: {
        marginTop: 20,
        maxHeight: 300,
        overflowY: "auto",
        border: "1px solid #eee",
        borderRadius: 4,
    },
    resultItem: {
        "&:hover": {
            backgroundColor: "#f5f5f5",
        },
    },
    dateText: {
        fontSize: "0.75rem",
        color: "#999",
    },
    messageSnippet: {
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        textOverflow: "ellipsis",
        fontSize: "0.85rem",
        color: "#666",
    },
}));

// Funções utilitárias que podem ser externalizadas depois, mantidas aqui para o isolamento
const highlightTerm = (text, term) => {
    if (!text || !term) return text;
    const regex = new RegExp(`(${term})`, "gi");
    const parts = String(text).split(regex);
    return parts.map((part, i) =>
        regex.test(part) ? (
            <mark key={i} style={{ backgroundColor: "#fff3cd", padding: 0 }}>
                {part}
            </mark>
        ) : (
            part
        )
    );
};

const AdvancedSearchModal = ({
    open,
    onClose,
    modalFilters,
    setModalFilters,
    searchResults,
    setSearchResults,
    searchLoading,
    handleExecuteAdvancedSearch,
    handleResultClick,
}) => {
    const classes = useStyles();

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <div className={classes.dialogHeader}>
                <div className={classes.dialogTitle}>
                    <SearchIcon style={{ color: "#fff" }} /> Busca Avançada
                </div>
                <IconButton size="small" onClick={onClose} className={classes.dialogCloseIcon}>
                    <CloseIcon />
                </IconButton>
            </div>
            <DialogContent dividers style={{ padding: "24px", minHeight: "400px" }}>
                <Grid container spacing={3} alignItems="flex-end">
                    <Grid item xs={12}>
                        <TextField
                            label={
                                modalFilters.searchType === "message"
                                    ? "Digite o trecho da mensagem..."
                                    : "Digite nome, número ou protocolo..."
                            }
                            variant="outlined"
                            fullWidth
                            value={modalFilters.term}
                            onChange={(e) => setModalFilters((prev) => ({ ...prev, term: e.target.value }))}
                            onKeyDown={(e) => e.key === "Enter" && handleExecuteAdvancedSearch()}
                            autoFocus
                            InputProps={{
                                endAdornment: (
                                    <IconButton onClick={handleExecuteAdvancedSearch} disabled={searchLoading}>
                                        <SearchIcon />
                                    </IconButton>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <FormControl component="fieldset">
                            <Typography variant="caption" color="textSecondary">
                                Buscar por:
                            </Typography>
                            <RadioGroup
                                row
                                value={modalFilters.searchType}
                                onChange={(e) => {
                                    setModalFilters((prev) => ({ ...prev, searchType: e.target.value }));
                                    setSearchResults([]);
                                }}
                            >
                                <FormControlLabel
                                    value="contact"
                                    control={<Radio color="primary" size="small" />}
                                    label={
                                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                            <PersonIcon fontSize="small" /> Contato
                                        </div>
                                    }
                                />
                                <FormControlLabel
                                    value="message"
                                    control={<Radio color="primary" size="small" />}
                                    label={
                                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                            <MessageIcon fontSize="small" /> Mensagem
                                        </div>
                                    }
                                />
                            </RadioGroup>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6} sm={2}>
                        <TextField
                            label="De"
                            type="date"
                            fullWidth
                            variant="standard"
                            InputLabelProps={{ shrink: true }}
                            value={modalFilters.dateFrom}
                            onChange={(e) => setModalFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                        />
                    </Grid>
                    <Grid item xs={6} sm={2}>
                        <TextField
                            label="Até"
                            type="date"
                            fullWidth
                            variant="standard"
                            InputLabelProps={{ shrink: true }}
                            value={modalFilters.dateTo}
                            onChange={(e) => setModalFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <FormControl fullWidth variant="standard">
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={modalFilters.status}
                                onChange={(e) => setModalFilters((prev) => ({ ...prev, status: e.target.value }))}
                            >
                                <MenuItem value="all">Todos</MenuItem>
                                <MenuItem value="open">Abertos</MenuItem>
                                <MenuItem value="closed">Fechados</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                <div className={classes.resultListContainer}>
                    {searchLoading ? (
                        <div style={{ padding: 40, textAlign: "center" }}>
                            <CircularProgress />
                            <Typography variant="body2" color="textSecondary" style={{ marginTop: 10 }}>
                                Buscando...
                            </Typography>
                        </div>
                    ) : searchResults.length > 0 ? (
                        <List>
                            {searchResults.map((item, index) => (
                                <React.Fragment key={index}>
                                    <ListItem
                                        button
                                        onClick={() => handleResultClick(item)}
                                        className={classes.resultItem}
                                    >
                                        <ListItemAvatar>
                                            <Avatar src={item.profilePicUrl} alt={item.contactName}>
                                                {item.contactName ? item.contactName.charAt(0).toUpperCase() : "?"}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                    <Typography variant="subtitle2" style={{ fontWeight: "bold" }}>
                                                        {highlightTerm(
                                                            item.contactName || item.contactNumber,
                                                            modalFilters.term
                                                        )}
                                                    </Typography>
                                                    <Typography className={classes.dateText}>
                                                        {format(new Date(item.date), "dd/MM/yy HH:mm")}
                                                    </Typography>
                                                </div>
                                            }
                                            secondary={
                                                item.type === "message" ? (
                                                    <span className={classes.messageSnippet}>
                                                        {highlightTerm(item.body, modalFilters.term)}
                                                    </span>
                                                ) : (
                                                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                                        Status:{" "}
                                                        <b>{item.status === "open" ? "Aberto" : "Fechado"}</b>
                                                    </span>
                                                )
                                            }
                                        />
                                        <ArrowIcon fontSize="small" color="disabled" />
                                    </ListItem>
                                    <Divider variant="inset" component="li" />
                                </React.Fragment>
                            ))}
                        </List>
                    ) : (
                        <div style={{ padding: 40, textAlign: "center", opacity: 0.5 }}>
                            <SearchIcon style={{ fontSize: 60, color: "#ccc" }} />
                            <Typography variant="body1" color="textSecondary" style={{ marginTop: 10 }}>
                                {modalFilters.term
                                    ? "Nenhum resultado encontrado."
                                    : "Digite algo e clique na lupa para buscar."}
                            </Typography>
                        </div>
                    )}
                </div>
            </DialogContent>
            <DialogActions style={{ padding: "16px 24px", backgroundColor: "#f5f5f5" }}>
                <Button onClick={onClose} color="secondary">
                    Fechar
                </Button>
                <Button
                    onClick={handleExecuteAdvancedSearch}
                    variant="contained"
                    color="primary"
                    disabled={searchLoading}
                    startIcon={<SearchIcon />}
                >
                    Buscar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AdvancedSearchModal;
