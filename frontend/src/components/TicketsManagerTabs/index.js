import React, { useContext, useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import { format } from "date-fns";

import {
    Add as AddIcon,
    Search as SearchIcon,
    FilterList as FilterListIcon,
    Clear as ClearIcon,
    Close as CloseIcon,
    Message as MessageIcon,
    Person as PersonIcon,
    ArrowForwardIos as ArrowIcon,
} from "@material-ui/icons";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import InputBase from "@material-ui/core/InputBase";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Badge from "@material-ui/core/Badge";
import ChatIcon from "@material-ui/icons/Chat";
import DoneAllIcon from "@material-ui/icons/DoneAll";
import GroupIcon from "@material-ui/icons/Group";
import {
    Button,
    IconButton,
    FormControlLabel,
    Switch,
    Dialog,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Tooltip,
    Radio,
    RadioGroup,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Divider,
    CircularProgress,
} from "@material-ui/core";

import NewTicketModal from "../NewTicketModal";
import TicketsList from "../TicketsListCustom";
import TicketsListGroup from "../TicketsListGroup";
import TabPanel from "../TabPanel";
import TicketsQueueSelect from "../TicketsQueueSelect";
import { TagsFilter } from "../TagsFilter";
import { UsersFilter } from "../UsersFilter";
import { Can } from "../Can";

import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = makeStyles((theme) => ({
    ticketsWrapper: {
        position: "relative",
        display: "flex",
        height: "100%",
        flexDirection: "column",
        overflow: "hidden",
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
    },
    tabsHeader: {
        flex: "none",
        backgroundColor: theme.palette.background.paper,
    },
    ticketOptionsBox: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: theme.palette.background.paper,
        padding: theme.spacing(1),
    },
    serachInputWrapper: {
        flex: 1,
        backgroundColor: theme.palette.background.default,
        display: "flex",
        borderRadius: 40,
        padding: 4,
        marginRight: theme.spacing(1),
        border: `1px solid ${theme.palette.divider}`,
    },
    searchIcon: {
        color: theme.palette.text.secondary,
        marginLeft: 6,
        marginRight: 6,
        alignSelf: "center",
    },
    searchInput: {
        flex: 1,
        border: "none",
        borderRadius: 30,
        padding: "10px",
        outline: "none",
    },
    tab: {
        minWidth: 60,
        width: 60,
    },
    badge: {
        right: "-10px",
    },
    filterBtn: {
        marginRight: 10,
    },
    // --- ESTILOS DO MODAL AVANÇADO ---
    dialogHeader: {
        backgroundColor: theme.palette.primary.main,
        color: "#fff",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    },
    dialogTitle: {
        fontSize: "1.1rem",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: 10,
    },
    dialogCloseIcon: {
        color: "#fff",
        padding: 4,
    },
    resultListContainer: {
        maxHeight: "400px",
        overflowY: "auto",
        marginTop: 20,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 8,
        backgroundColor: theme.palette.background.default,
    },
    resultItem: {
        cursor: "pointer",
        transition: "background-color 0.2s",
        "&:hover": {
            backgroundColor: theme.palette.action.hover,
        },
    },
    messageSnippet: {
        display: "-webkit-box",
        "-webkit-line-clamp": 2,
        "-webkit-box-orient": "vertical",
        overflow: "hidden",
        fontSize: "0.9rem",
        color: theme.palette.text.secondary,
    },
    highlight: {
        backgroundColor: "#fff59d", // Amarelo marca texto
        fontWeight: "bold",
        color: "#000",
    },
    dateText: {
        fontSize: "0.75rem",
        color: theme.palette.text.hint,
        whiteSpace: "nowrap",
    },
}));

const TicketsManagerTabs = () => {
    const classes = useStyles();
    const history = useHistory();

    const [searchInput, setSearchInput] = useState("");
    const [searchParam, setSearchParam] = useState("");
    const [tab, setTab] = useState("open");
    const [tabOpen, setTabOpen] = useState("open");
    const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
    const [showAllTickets, setShowAllTickets] = useState(false);
    const searchInputRef = useRef();

    const { user } = useContext(AuthContext);
    const { profile } = user;
    const userQueueIds = user.queues.map((q) => q.id);

    const [openCount, setOpenCount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [selectedQueueIds, setSelectedQueueIds] = useState(userQueueIds || []);
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);

    const [setClosedBox, setClosed] = useState(false);
    const [setGroupBox, setGroup] = useState(false);

    const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResults, setSearchResults] = useState([]);

    // Estado dos Filtros do Modal
    const [modalFilters, setModalFilters] = useState({
        searchType: "contact", // Padrão: Contato
        term: "",
        dateFrom: "",
        dateTo: "",
        status: "all",
    });

    useEffect(() => {
        async function fetchData() {
            try {
                const { data } = await api.get("/settings/");
                const viewClosed = data.find((s) => s.key === "viewclosed");
                const viewGroups = data.find((s) => s.key === "viewgroups");

                if (viewClosed?.value === "enabled" || user.profile === "admin") setClosed(true);
                if (viewGroups?.value === "enabled" || user.profile === "admin") setGroup(true);
            } catch (err) {
                toastError(err);
            }
        }
        fetchData();
    }, [user.profile]);

    useEffect(() => {
        if (user.profile.toUpperCase() === "ADMIN") {
            setShowAllTickets(true);
        }
    }, [user.profile]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            const term = searchInput.toLowerCase();
            if (term !== searchParam) {
                setSearchParam(term);
                if (term === "") setTab("open");
                else if (tab !== "search") setTab("search");
            }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchInput, tab]);

    const handleSearchInput = (e) => {
        setSearchInput(e.target.value);
    };

    const executeSearch = () => {
        // lógica da busca: usar searchInput/param/etc.
        setSearchParam(searchInput); // ou o que for adequado
        
    };


    // --- FUNÇÃO DE BUSCA DO MODAL (CORRIGIDA) ---
    const handleExecuteAdvancedSearch = async () => {
        if (!modalFilters.term || modalFilters.term.length < 3) {
            // Pode adicionar aviso se quiser
        }

        setSearchLoading(true);

        // Define explicitamente o valor de includeMessages
        const includeMessagesValue = modalFilters.searchType === "message" ? "true" : "false";

        // Log de Debug para conferir o que está saindo
        console.log("🚀 [Frontend] Executando Busca com:", {
            term: modalFilters.term,
            type: modalFilters.searchType,
            includeMessages: includeMessagesValue,
        });

        try {
            const { data } = await api.get("/tickets", {
                params: {
                    searchParam: modalFilters.term,
                    pageNumber: 1,
                    status: modalFilters.status === "all" ? "" : modalFilters.status,
                    showAll: true,
                    dateFrom: modalFilters.dateFrom,
                    dateTo: modalFilters.dateTo,
                    includeMessages: includeMessagesValue, // Envia string "true" ou "false"
                    queueIds: JSON.stringify(selectedQueueIds),
                },
            });

            console.log("🔍 [Frontend] Retorno API:", data);

            let formattedResults = [];

            if (modalFilters.searchType === "message") {
                // FLATTEN: Extrai as mensagens de dentro dos tickets
                if (data.tickets && Array.isArray(data.tickets)) {
                    data.tickets.forEach((ticket) => {
                        // Verifica se ticket.messages existe e é array
                        if (ticket.messages && Array.isArray(ticket.messages)) {
                            ticket.messages.forEach((msg) => {
                                formattedResults.push({
                                    type: "message",
                                    id: msg.id,
                                    ticketId: ticket.id,
                                    ticketUuid: ticket.uuid,
                                    contactName: ticket.contact?.name || "Sem Nome",
                                    contactNumber: ticket.contact?.number || "",
                                    body: msg.body,
                                    date: msg.createdAt || ticket.updatedAt,
                                    status: ticket.status,
                                    profilePicUrl: ticket.contact?.profilePicUrl,
                                });
                            });
                        }
                    });
                }
            } else {
                // Lista de Contatos/Tickets (Padrão)
                if (data.tickets && Array.isArray(data.tickets)) {
                    formattedResults = data.tickets.map((ticket) => ({
                        type: "contact",
                        id: ticket.id,
                        ticketUuid: ticket.uuid,
                        contactName: ticket.contact?.name || "Sem Nome",
                        contactNumber: ticket.contact?.number || "",
                        lastMessage: ticket.lastMessage,
                        profilePicUrl: ticket.contact?.profilePicUrl,
                        date: ticket.updatedAt,
                        status: ticket.status,
                    }));
                }
            }

            console.log("✅ [Frontend] Resultados Formatados:", formattedResults);
            setSearchResults(formattedResults);
        } catch (err) {
            console.error(err);
            toastError(err);
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleResultClick = (item) => {
        setAdvancedSearchOpen(false);
        if (item.type === "message") {
            // Passa messageId na URL para o Chat ler
            history.push(`/tickets/${item.ticketUuid}?messageId=${item.id}`);
        } else {
            history.push(`/tickets/${item.ticketUuid}`);
        }
    };

    const highlightTerm = (text, term) => {
        if (!text) return "";
        if (!term) return text;
        const textStr = String(text);
        try {
            const parts = textStr.split(new RegExp(`(${term})`, "gi"));
            return (
                <span>
                    {parts.map((part, i) =>
                        part.toLowerCase() === term.toLowerCase() ? (
                            <span key={i} className={classes.highlight}>
                                {part}
                            </span>
                        ) : (
                            part
                        )
                    )}
                </span>
            );
        } catch (e) {
            return textStr;
        }
    };

    const handleChangeTab = (e, newValue) => {
        setTab(newValue);
    };
    const handleChangeTabOpen = (e, newValue) => {
        setTabOpen(newValue);
    };
    const applyPanelStyle = (status) => {
        if (tabOpen !== status) {
            return { width: 0, height: 0 };
        }
    };
    const handleCloseOrOpenTicket = (ticket) => {
        setNewTicketModalOpen(false);
        if (ticket?.uuid) history.push(`/tickets/${ticket.uuid}`);
    };
    const handleSelectedTags = (selecteds) => {
        setSelectedTags(selecteds.map((t) => t.id));
    };
    const handleSelectedUsers = (selecteds) => {
        setSelectedUsers(selecteds.map((t) => t.id));
    };

    return (
        <Paper elevation={0} variant="outlined" className={classes.ticketsWrapper}>
            <NewTicketModal modalOpen={newTicketModalOpen} onClose={(ticket) => handleCloseOrOpenTicket(ticket)} />

            <Paper elevation={0} square className={classes.tabsHeader}>
                <Tabs
                    value={tab}
                    onChange={handleChangeTab}
                    variant="fullWidth"
                    indicatorColor="primary"
                    textColor="primary"
                >
                    <Tab value={"open"} icon={<ChatIcon />} classes={{ root: classes.tab }} />
                    {setGroupBox && <Tab value={"group"} icon={<GroupIcon />} classes={{ root: classes.tab }} />}
                    {setClosedBox && <Tab value={"closed"} icon={<DoneAllIcon />} classes={{ root: classes.tab }} />}
                    <Tab value={"search"} icon={<SearchIcon />} classes={{ root: classes.tab }} />
                </Tabs>
            </Paper>

            <Paper square elevation={0} className={classes.ticketOptionsBox}>
                {tab === "search" ? (
                    <>
                        <div className={classes.serachInputWrapper}>
                            <InputBase
                                className={classes.searchInput}
                                inputRef={searchInputRef}
                                placeholder={i18n.t("tickets.search.placeholder")}
                                type="search"
                                value={searchInput}
                                onChange={handleSearchInput}
                                onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    executeSearch();
                                }
                                }}
                            />
                            <IconButton
                                size="small"
                                onClick={executeSearch}
                                aria-label="Buscar"
                            >
                                <SearchIcon fontSize="small" />
                            </IconButton>

                            {searchInput && (
                                <IconButton
                                size="small"
                                onClick={() => {
                                    setSearchInput("");
                                    setSearchParam("");
                                    searchInputRef.current.focus();
                                }}
                                aria-label="Limpar pesquisa"
                                >
                                <ClearIcon fontSize="small" />
                                </IconButton>
                            )}
                        </div>
                        <Tooltip title="Busca Avançada">
                            <IconButton
                                className={classes.filterBtn}
                                onClick={() => setAdvancedSearchOpen(true)}
                                color="primary"
                            >
                                <FilterListIcon />
                            </IconButton>
                        </Tooltip>
                    </>
                ) : (
                    <>
                        {(tab === "open" || tab === "closed") && (
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => setNewTicketModalOpen(true)}
                                startIcon={<AddIcon />}
                            >
                                {i18n.t("Novo")}
                            </Button>
                        )}
                        <Can
                            role={user.profile}
                            perform="tickets-manager:showall"
                            yes={() => (
                                <FormControlLabel
                                    label={i18n.t("tickets.buttons.showAll")}
                                    labelPlacement="start"
                                    control={
                                        <Switch
                                            size="small"
                                            checked={showAllTickets}
                                            onChange={() => setShowAllTickets((prevState) => !prevState)}
                                            name="showAllTickets"
                                            color="primary"
                                        />
                                    }
                                />
                            )}
                        />
                    </>
                )}
                <TicketsQueueSelect
                    style={{ marginLeft: 6 }}
                    selectedQueueIds={selectedQueueIds}
                    userQueues={user?.queues}
                    onChange={(values) => setSelectedQueueIds(values)}
                />
            </Paper>

            {/* TAB PANELS */}
            <TabPanel value={tab} name="open" className={classes.ticketsWrapper}>
                <Tabs
                    value={tabOpen}
                    onChange={handleChangeTabOpen}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="fullWidth"
                >
                    <Tab
                        label={
                            <Badge className={classes.badge} badgeContent={openCount} color="primary">
                                {i18n.t("ticketsList.assignedHeader")}
                            </Badge>
                        }
                        value={"open"}
                    />
                    <Tab
                        label={
                            <Badge className={classes.badge} badgeContent={pendingCount} color="primary">
                                {i18n.t("ticketsList.pendingHeader")}
                            </Badge>
                        }
                        value={"pending"}
                    />
                </Tabs>
                <Paper className={classes.ticketsWrapper}>
                    <TicketsList
                        status="open"
                        showAll={showAllTickets}
                        selectedQueueIds={selectedQueueIds}
                        updateCount={(val) => setOpenCount(val)}
                        style={applyPanelStyle("open")}
                    />
                    <TicketsList
                        status="pending"
                        selectedQueueIds={selectedQueueIds}
                        updateCount={(val) => setPendingCount(val)}
                        style={applyPanelStyle("pending")}
                    />
                </Paper>
            </TabPanel>

            <TabPanel value={tab} name="group" className={classes.ticketsWrapper}>
                <Tabs
                    value={tabOpen}
                    onChange={handleChangeTabOpen}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="fullWidth"
                >
                    <Tab
                        label={
                            <Badge className={classes.badge} badgeContent={openCount} color="primary">
                                {i18n.t("ticketsList.assignedHeader")}
                            </Badge>
                        }
                        value={"open"}
                    />
                    <Tab
                        label={
                            <Badge className={classes.badge} badgeContent={pendingCount} color="primary">
                                {i18n.t("ticketsList.pendingHeader")}
                            </Badge>
                        }
                        value={"pending"}
                    />
                </Tabs>
                <Paper className={classes.ticketsWrapper}>
                    <TicketsListGroup
                        status="open"
                        showAll={showAllTickets}
                        selectedQueueIds={selectedQueueIds}
                        updateCount={(val) => setOpenCount(val)}
                        style={applyPanelStyle("open")}
                    />
                    <TicketsListGroup
                        status="pending"
                        selectedQueueIds={selectedQueueIds}
                        updateCount={(val) => setPendingCount(val)}
                        style={applyPanelStyle("pending")}
                    />
                </Paper>
            </TabPanel>

            <TabPanel value={tab} name="closed" className={classes.ticketsWrapper}>
                <TicketsList status="closed" showAll={true} selectedQueueIds={selectedQueueIds} />
            </TabPanel>

            <TabPanel value={tab} name="search" className={classes.ticketsWrapper}>
                <TagsFilter onFiltered={handleSelectedTags} />
                {profile === "admin" && <UsersFilter onFiltered={handleSelectedUsers} />}
                <TicketsList
                    searchParam={searchParam}
                    showAll={true}
                    tags={selectedTags}
                    users={selectedUsers}
                    selectedQueueIds={selectedQueueIds}
                />
            </TabPanel>

            {/* MODAL DE BUSCA AVANÇADA */}
            <Dialog open={advancedSearchOpen} onClose={() => setAdvancedSearchOpen(false)} fullWidth maxWidth="md">
                <div className={classes.dialogHeader}>
                    <div className={classes.dialogTitle}>
                        <SearchIcon style={{ color: "#fff" }} /> Busca Avançada
                    </div>
                    <IconButton
                        size="small"
                        onClick={() => setAdvancedSearchOpen(false)}
                        className={classes.dialogCloseIcon}
                    >
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
                    <Button onClick={() => setAdvancedSearchOpen(false)} color="secondary">
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
        </Paper>
    );
};

export default TicketsManagerTabs;
