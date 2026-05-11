import React, { useState, useEffect, useReducer, useContext, useRef } from "react";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";
import {
    Tooltip,
    Typography,
    Grid,
    Card,
    CardContent,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Menu,
    Fade,
    useMediaQuery,
    useTheme,
    Box,
    Avatar,
    Divider,
    IconButton,
    Badge,
    ListSubheader,
} from "@material-ui/core";
import { makeStyles, alpha } from "@material-ui/core/styles";
import Checkbox from "@material-ui/core/Checkbox";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";

import {
    WhatsApp,
    Search,
    DeleteOutline,
    Edit,
    ImportExport,
    Backup,
    ContactPhone,
    CloudDownload,
    FilterList,
    Sort,
    MoreVert,
    Today,
    DateRange,
    Event,
    Group,
    Add,
    TrendingUp,
    Check,
    LocalOffer,
} from "@material-ui/icons";
import WysiwygIcon from "@mui/icons-material/Wysiwyg";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";

import api from "../../services/api";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import ContactModal from "../../components/ContactModal";
import ContactManagementModal from "../../components/ContactManagementModal";
import ContactMergeModal from "../../components/ContactMergeModal";
import ConfirmationModal from "../../components/ConfirmationModal";

import { i18n } from "../../translate/i18n";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import MainContainer from "../../components/MainContainer";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Can } from "../../components/Can";
import NewTicketModal from "../../components/NewTicketModal";
import { SocketContext } from "../../context/Socket/SocketContext";
import { CSVLink } from "react-csv";

import PopupState, { bindTrigger, bindMenu } from "material-ui-popup-state";
import { isSameDay, isSameWeek, isSameMonth, parseISO } from "date-fns";

const reducer = (state, action) => {
    if (action.type === "LOAD_CONTACTS") {
        const contacts = action.payload;
        const newContacts = [];
        contacts.forEach((contact) => {
            const contactIndex = state.findIndex((c) => c.id === contact.id);
            if (contactIndex !== -1) {
                state[contactIndex] = contact;
            } else {
                newContacts.push(contact);
            }
        });
        return [...state, ...newContacts];
    }
    if (action.type === "UPDATE_CONTACTS") {
        const contact = action.payload;
        const contactIndex = state.findIndex((c) => c.id === contact.id);
        if (contactIndex !== -1) {
            state[contactIndex] = contact;
            return [...state];
        } else {
            return [contact, ...state];
        }
    }
    if (action.type === "DELETE_CONTACT") {
        const contactId = action.payload;
        const contactIndex = state.findIndex((c) => c.id === contactId);
        if (contactIndex !== -1) {
            state.splice(contactIndex, 1);
        }
        return [...state];
    }
    if (action.type === "RESET") {
        return [];
    }
};

const useStyles = makeStyles((theme) => ({
    mainPaper: {
        flex: 1,
        padding: theme.spacing(1),
        overflowY: "scroll",
        ...theme.scrollbarStyles,
        borderRadius: "12px",
        boxShadow: "none",
        border: "none",
        backgroundColor: "transparent",
        [theme.breakpoints.up("md")]: {
            backgroundColor: theme.palette.background.paper,
            padding: theme.spacing(2),
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        },
    },
    // --- HEADER ---
    headerContainer: {
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(1),
    },
    filterBar: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(1),
        width: "100%",
    },
    searchInput: {
        backgroundColor: theme.palette.background.paper,
        borderRadius: "8px",
        flex: 1,
        "& .MuiOutlinedInput-root": {
            "& fieldset": { borderColor: theme.palette.divider },
            "&:hover fieldset": { borderColor: theme.palette.primary.main },
            "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
            borderRadius: "8px",
        },
    },
    desktopFilters: {
        display: "flex",
        gap: theme.spacing(1),
        alignItems: "center",
        [theme.breakpoints.down("sm")]: {
            display: "none",
        },
    },
    filterFormControl: {
        minWidth: 140,
        backgroundColor: theme.palette.background.paper,
        borderRadius: "8px",
        "& .MuiOutlinedInput-root": { borderRadius: "8px" },
    },
    actionBtn: {
        height: 40,
        borderRadius: "8px",
        textTransform: "none",
        fontWeight: 600,
        boxShadow: "none",
        whiteSpace: "nowrap",
        minWidth: "auto",
        "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.1)" },
    },
    // --- KPI ---
    kpiContainer: {
        marginBottom: theme.spacing(2),
        [theme.breakpoints.down("sm")]: {
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: theme.spacing(1.5),
        },
    },
    kpiCard: {
        cursor: "pointer",
        borderRadius: "12px",
        transition: "all 0.3s",
        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
        border: `1.5px solid ${theme.palette.divider}`,
        position: "relative",
        overflow: "hidden",
        height: "100%",
        display: "flex",
        padding: "10px 30px 10px 30px",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: theme.palette.background.paper,
        "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
        },
        "&.active": {
            border: `1.5px solid ${theme.palette.primary.main}`,
            backgroundColor: alpha(theme.palette.primary.main, 0.04),
        },
        "& h4": {
            fontWeight: 800, 
            fontSize: "2rem",
            color: theme.palette.text.primary, 
            margin: "4px 0"
        },
        [theme.breakpoints.down("sm")]: {
            padding: "0px 4px 4px 20px",
            height: "100px",
            minWidth: "180px",
            "& h4": { 
                fontSize: "1.75rem",
                marginBottom: "0px",
                },
        },
    },
    kpiContent: {
        padding: "6px !important",
        display: "flex",
        flexDirection: "column",
        height: "100%",
    },
    kpiHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    },
    kpiIconBox: {
        padding: theme.spacing(0.5),
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.palette.action.hover,
    },
    kpiFooter: {
        marginTop: "auto",
        paddingTop: theme.spacing(0.5),
        borderTop: `1px dashed ${theme.palette.divider}`,
        display: "flex",
        alignItems: "center",
        color: theme.palette.text.secondary,
        fontSize: "0.7rem",
        gap: "4px",
    },
    // --- MOBILE CARD ---
    mobileCard: {
        backgroundColor: theme.palette.laneKanbanBackground,
        borderRadius: "12px",
        padding: theme.spacing(2),
        marginBottom: theme.spacing(1.5),
        boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
        border: `1px solid ${theme.palette.divider}`,
        display: "flex",
        flexDirection: "column",
        position: "relative",
    },
    mobileCardHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: theme.spacing(1),
    },
    mobileCardContent: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        color: theme.palette.text.secondary,
        fontSize: "0.85rem",
        marginBottom: theme.spacing(1.5),
    },
    mobileCardActions: {
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: theme.spacing(1),
        borderTop: `1px solid ${theme.palette.divider}`,
        paddingTop: theme.spacing(1),
    },
    contactNameLink: {
        color: theme.palette.text.primary,
        cursor: "pointer",
        fontWeight: "700",
        fontSize: "1rem",
        "&:hover": { color: theme.palette.primary.main },
    },
    avatarWithBadge: {
        border: `2px solid ${theme.palette.success.main}`,
        padding: 2,
        width: 48,
        height: 48,
    },
    tableRow: {
        "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.04) },
    },
    menuHeader: {
        fontWeight: "bold",
        color: theme.palette.primary.main,
        padding: "8px 16px",
        fontSize: "0.75rem",
        textTransform: "uppercase",
        backgroundColor: alpha(theme.palette.grey[100], 0.5),
    },
    selectedMenuItem: {
        backgroundColor: alpha(theme.palette.primary.main, 0.1) + " !important",
        color: theme.palette.primary.main,
        fontWeight: 600,
    },
    tagDot: {
        width: 10,
        height: 10,
        borderRadius: "50%",
        marginRight: 8,
        display: "inline-block",
    },
}));

const Contacts = () => {
    const classes = useStyles();
    const history = useHistory();
    const { user } = useContext(AuthContext);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const [loading, setLoading] = useState(false);
    const [pageNumber, setPageNumber] = useState(1);
    const [searchParam, setSearchParam] = useState("");
    const [contacts, dispatch] = useReducer(reducer, []);
    const [selectedContactId, setSelectedContactId] = useState(null);
    const [selectedContactName, setSelectedContactName] = useState("");

    // KPI & Filtros
    const [dashboardData, setDashboardData] = useState({ countTotal: 0, countToday: 0, countWeek: 0, countMonth: 0 });
    const [filterDate, setFilterDate] = useState("total");
    const [sortBy, setSortBy] = useState("name_asc");
    const [filterTag, setFilterTag] = useState("");
    const [tags, setTags] = useState([]);

    // Modais
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
    const [managementModalOpen, setManagementModalOpen] = useState(false);
    const [mergeModalOpen, setMergeModalOpen] = useState(false);
    const [contactTicket, setContactTicket] = useState({});

    // Ações
    const [deletingContact, setDeletingContact] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedContacts, setSelectedContacts] = useState([]);
    const fileUploadRef = useRef(null);
    const [actionsAnchorEl, setActionsAnchorEl] = useState(null);

    // --- CARREGAR TAGS ---
    useEffect(() => {
        const fetchTags = async () => {
            try {
                const { data } = await api.get("/tags/list");
                setTags(data);
            } catch (err) {
                console.error("Erro ao carregar tags", err);
            }
        };
        fetchTags();
    }, []);

    // --- CARREGAR DASHBOARD ---
    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const { data } = await api.get("/contacts/dashboard");
                setDashboardData(data);
            } catch (err) {
                console.error("Erro ao carregar KPI", err);
            }
        };
        fetchDashboard();
    }, [contacts]); // Recarrega KPIs se contatos mudarem

    // --- SELEÇÃO DE CONTATOS VISÍVEIS ---
    useEffect(() => {
        if (selectAll) {
            const visibleIds = sortedContacts().map((c) => c.id);
            setSelectedContacts(visibleIds);
        } else {
            setSelectedContacts([]);
        }
    }, [selectAll]);

    const handleSelectAll = () => setSelectAll(!selectAll);
    const handleCheckboxChange = (contactId) => {
        setSelectedContacts((prevSelected) => {
            if (prevSelected.includes(contactId)) return prevSelected.filter((id) => id !== contactId);
            return [...prevSelected, contactId];
        });
    };

    const socketManager = useContext(SocketContext);

    // RESETAR LISTA AO MUDAR FILTROS
    useEffect(() => {
        dispatch({ type: "RESET" });
        setPageNumber(1);
    }, [searchParam, filterDate, filterTag]);

    // BUSCA CONTATOS NO BACKEND (COM FILTROS)
    useEffect(() => {
        setLoading(true);
        const delayDebounceFn = setTimeout(() => {
            const fetchContacts = async () => {
                try {
                    const { data } = await api.get("/contacts/", {
                        params: {
                            searchParam,
                            pageNumber,
                            filterDate,
                            tags: filterTag ? [filterTag] : [], // Passa tags para o backend
                        },
                    });
                    dispatch({ type: "LOAD_CONTACTS", payload: data.contacts });
                    setHasMore(data.hasMore);
                    setLoading(false);
                } catch (err) {
                    toastError(err);
                }
            };
            fetchContacts();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchParam, pageNumber, filterDate, filterTag]);

    useEffect(() => {
        const companyId = localStorage.getItem("companyId");
        const socket = socketManager.getSocket(companyId);

        socket.on(`company-${companyId}-contact`, (data) => {
            if (data.action === "update" || data.action === "create") {
                dispatch({ type: "UPDATE_CONTACTS", payload: data.contact });
            }
            if (data.action === "delete") {
                dispatch({ type: "DELETE_CONTACT", payload: +data.contactId });
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [socketManager]);

    // --- ORDENAÇÃO VISUAL (SEM FILTRO DE DATA AQUI) ---
    const sortedContacts = () => {
        // CORREÇÃO: Não filtramos mais por data no frontend.
        // O backend já mandou apenas os dados filtrados.
        let list = [...contacts];

        list.sort((a, b) => {
            if (sortBy === "name_asc") return a.name.localeCompare(b.name);
            if (sortBy === "name_desc") return b.name.localeCompare(a.name);
            if (sortBy === "created_desc") return new Date(b.createdAt) - new Date(a.createdAt);
            if (sortBy === "created_asc") return new Date(a.createdAt) - new Date(b.createdAt);
            return 0;
        });

        return list;
    };

    const handleKpiClick = (kpiId) => {
        setFilterDate(kpiId);
    };

    // ... Funções de UI ...
    const handleSearch = (event) => setSearchParam(event.target.value.toLowerCase());
    const handleOpenActionsMenu = (event) => setActionsAnchorEl(event.currentTarget);
    const handleCloseActionsMenu = () => setActionsAnchorEl(null);
    const handleSortOption = (option) => {
        setSortBy(option);
        handleCloseActionsMenu();
    };
    const handleTagOption = (tagId) => {
        setFilterTag(tagId);
        handleCloseActionsMenu();
    };

    const handleOpenContactModal = () => {
        setSelectedContactId(null);
        setContactModalOpen(true);
        handleCloseActionsMenu();
    };
    const handleCloseContactModal = () => {
        setSelectedContactId(null);
        setContactModalOpen(false);
    };
    const handleOpenManagementModal = (contactId) => {
        setSelectedContactId(contactId);
        setManagementModalOpen(true);
    };
    const handleOpenMergeModal = (contactId, name) => {
        setSelectedContactId(contactId);
        setSelectedContactName(name);
        setMergeModalOpen(true);
    };
    const hadleEditContact = (contactId) => {
        setSelectedContactId(contactId);
        setContactModalOpen(true);
    };
    const handleCloseOrOpenTicket = (ticket) => {
        setNewTicketModalOpen(false);
        if (ticket?.uuid) history.push(`/tickets/${ticket.uuid}`);
    };

    const handleDeleteContact = async (contactId) => {
        try {
            await api.delete(`/contacts/${contactId}`);
            toast.success(i18n.t("contacts.toasts.deleted"));
        } catch (err) {
            toastError(err);
        }
        setDeletingContact(null);
        setSearchParam("");
        setPageNumber(1);
    };
    const handleDeleteSelectedContacts = async () => {
        try {
            for (const contactId of selectedContacts) {
                await api.delete(`/contacts/${contactId}`);
            }
            toast.success("Contatos excluídos!");
            setSelectedContacts([]);
            setSelectAll(false);
            setSearchParam("");
            setPageNumber(1);
        } catch (err) {
            toastError(err);
        } finally {
            setConfirmBulkDeleteOpen(false);
        }
    };
    const handleImportContact = async () => {
        try {
            if (!!fileUploadRef.current.files[0]) {
                const formData = new FormData();
                formData.append("file", fileUploadRef.current.files[0]);
                await api.request({ url: `/contacts/upload`, method: "POST", data: formData });
            } else {
                await api.post("/contacts/import");
            }
            history.go(0);
        } catch (err) {
            toastError(err);
        }
    };

    const loadMore = () => setPageNumber((prevState) => prevState + 1);
    const handleScroll = (e) => {
        if (!hasMore || loading) return;
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - (scrollTop + 100) < clientHeight) loadMore();
    };

    function getDateLastMessage(contact) {
        if (!contact || !contact.tickets || contact.tickets.length === 0) return null;
        const lastTicket = contact.tickets.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
        const date = new Date(lastTicket.updatedAt);
        return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear().toString().slice(-2)} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    }

    const renderKPIs = () => {
        const kpis = [
            {
                id: "today",
                title: "Hoje",
                count: dashboardData.countToday,
                label: "Novos contatos",
                icon: <Today fontSize="small" />,
                color: "#4caf50",
            },
            {
                id: "week",
                title: "Esta Semana",
                count: dashboardData.countWeek,
                label: "Últimos 7 dias",
                icon: <DateRange fontSize="small" />,
                color: "#2196f3",
            },
            {
                id: "month",
                title: "Este Mês",
                count: dashboardData.countMonth,
                label: "Mês atual",
                icon: <Event fontSize="small" />,
                color: "#ff9800",
            },
            {
                id: "total",
                title: "Total",
                count: dashboardData.countTotal,
                label: "Todos os contatos",
                icon: <Group fontSize="small" />,
                color: "#5c6bc0",
            },
        ];

        return (
            <Grid container spacing={2} className={classes.kpiContainer}>
                {kpis.map((kpi) => (
                    <Grid item xs={6} sm={6} md={3} key={kpi.id}>
                        <Card
                            className={`${classes.kpiCard} ${filterDate === kpi.id ? "active" : ""}`}
                            onClick={() => handleKpiClick(kpi.id)}
                            elevation={0}
                        >
                            <CardContent className={classes.kpiContent}>
                                <div className={classes.kpiHeader}>
                                    <Typography
                                        variant="caption"
                                        style={{
                                            fontWeight: 700,
                                            color: theme.palette.text.secondary,
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        {kpi.title}
                                    </Typography>
                                    <div
                                        className={classes.kpiIconBox}
                                        style={{ color: kpi.color, backgroundColor: alpha(kpi.color, 0.1) }}
                                    >
                                        {kpi.icon}
                                    </div>
                                </div>
                                <Typography
                                    variant="h4"
                                >
                                    {kpi.count}
                                </Typography>
                                <div className={classes.kpiFooter}>
                                    <TrendingUp fontSize="small" style={{ fontSize: 16, color: kpi.color }} />
                                    <span>{kpi.label}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        );
    };

    return (
        <MainContainer>
            {/* ... Modais ... */}
            <NewTicketModal
                modalOpen={newTicketModalOpen}
                initialContact={contactTicket}
                onClose={(ticket) => handleCloseOrOpenTicket(ticket)}
            />
            <ContactModal open={contactModalOpen} onClose={handleCloseContactModal} contactId={selectedContactId} />
            <ContactManagementModal
                open={managementModalOpen}
                onClose={() => setManagementModalOpen(false)}
                contactId={selectedContactId}
            />
            <ContactMergeModal
                open={mergeModalOpen}
                onClose={() => setMergeModalOpen(false)}
                contactId={selectedContactId}
                contactName={selectedContactName}
            />
            <ConfirmationModal
                title={deletingContact ? "Excluir?" : "Importar"}
                open={confirmOpen}
                onClose={setConfirmOpen}
                onConfirm={(e) => (deletingContact ? handleDeleteContact(deletingContact.id) : handleImportContact())}
            >
                {deletingContact ? "Não é possível reverter." : "Deseja importar?"}
            </ConfirmationModal>
            <ConfirmationModal
                title="Excluir Selecionados"
                open={confirmBulkDeleteOpen}
                onClose={() => setConfirmBulkDeleteOpen(false)}
                onConfirm={handleDeleteSelectedContacts}
            >
                Tem certeza que deseja excluir {selectedContacts.length} contatos?
            </ConfirmationModal>

            <MainHeader>
                <div className={classes.headerContainer}>
                    <Title>{i18n.t("contacts.title")}</Title>

                    <div className={classes.filterBar}>
                        <TextField
                            placeholder="Buscar contatos..."
                            type="search"
                            value={searchParam}
                            onChange={handleSearch}
                            variant="outlined"
                            size="small"
                            className={classes.searchInput}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search style={{ color: "#999" }} />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        {/* FILTROS DESKTOP */}
                        <div className={classes.desktopFilters}>
                            <FormControl variant="outlined" size="small" className={classes.filterFormControl}>
                                <InputLabel>Tags</InputLabel>
                                <Select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} label="Tags">
                                    <MenuItem value="">
                                        <em>Todas</em>
                                    </MenuItem>
                                    {tags.map((tag) => (
                                        <MenuItem key={tag.id} value={tag.id}>
                                            <span
                                                className={classes.tagDot}
                                                style={{ backgroundColor: tag.color || "#ccc" }}
                                            ></span>
                                            {tag.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl variant="outlined" size="small" className={classes.filterFormControl}>
                                <InputLabel>Ordenar</InputLabel>
                                <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} label="Ordenar">
                                    <MenuItem value="name_asc">Nome (A-Z)</MenuItem>
                                    <MenuItem value="name_desc">Nome (Z-A)</MenuItem>
                                    <MenuItem value="created_desc">Mais Recentes</MenuItem>
                                    <MenuItem value="created_asc">Mais Antigos</MenuItem>
                                </Select>
                            </FormControl>
                        </div>

                        {/* BOTÃO EXCLUIR */}
                        {selectedContacts.length > 0 && (
                            <Button
                                variant="contained"
                                style={{
                                    backgroundColor: theme.palette.type === "light" ? "#fee2e2" : "#7f1d1d",
                                    color: theme.palette.type === "light" ? "#dc2626" : "#fca5a5",
                                }}
                                onClick={() => setConfirmBulkDeleteOpen(true)}
                                className={classes.actionBtn}
                            >
                                <DeleteOutline />
                            </Button>
                        )}

                        {/* BOTÃO AÇÕES + MENU */}
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleOpenActionsMenu}
                            className={classes.actionBtn}
                            endIcon={<MoreVert />}
                        >
                            Ações
                        </Button>

                        <Menu
                            anchorEl={actionsAnchorEl}
                            open={Boolean(actionsAnchorEl)}
                            onClose={handleCloseActionsMenu}
                            PaperProps={{
                                style: { maxHeight: 400, width: "250px" },
                            }}
                        >
                            <div className={classes.menuHeader}>Ações Rápidas</div>
                            <MenuItem onClick={handleOpenContactModal}>
                                <Add style={{ marginRight: 10, color: "#4caf50" }} /> Adicionar
                            </MenuItem>
                            <MenuItem
                                onClick={() => {
                                    setConfirmOpen(true);
                                    handleCloseActionsMenu();
                                }}
                            >
                                <ContactPhone style={{ marginRight: 10, color: "#2196f3" }} /> Importar
                            </MenuItem>
                            <MenuItem
                                onClick={() => {
                                    fileUploadRef.current.click();
                                    handleCloseActionsMenu();
                                }}
                            >
                                <Backup style={{ marginRight: 10, color: "#ff9800" }} /> Upload Excel
                            </MenuItem>
                            <MenuItem>
                                <CSVLink
                                    style={{
                                        textDecoration: "none",
                                        display: "flex",
                                        alignItems: "center",
                                        color: "inherit",
                                        width: "100%",
                                    }}
                                    separator=";"
                                    filename={"contacts.csv"}
                                    data={contacts}
                                >
                                    <CloudDownload style={{ marginRight: 10, color: "#607d8b" }} /> Exportar CSV
                                </CSVLink>
                            </MenuItem>

                            {/* FILTROS MOBILE (SÓ RENDERIZA SE FOR MOBILE) */}
                            {isMobile && (
                                <>
                                    <Divider />
                                    <div className={classes.menuHeader}>Ordenar Por</div>
                                    <MenuItem
                                        onClick={() => handleSortOption("name_asc")}
                                        className={sortBy === "name_asc" ? classes.selectedMenuItem : ""}
                                    >
                                        Nome (A-Z){" "}
                                        {sortBy === "name_asc" && (
                                            <Check style={{ marginLeft: "auto", fontSize: 16 }} />
                                        )}
                                    </MenuItem>
                                    <MenuItem
                                        onClick={() => handleSortOption("name_desc")}
                                        className={sortBy === "name_desc" ? classes.selectedMenuItem : ""}
                                    >
                                        Nome (Z-A){" "}
                                        {sortBy === "name_desc" && (
                                            <Check style={{ marginLeft: "auto", fontSize: 16 }} />
                                        )}
                                    </MenuItem>
                                    <MenuItem
                                        onClick={() => handleSortOption("created_desc")}
                                        className={sortBy === "created_desc" ? classes.selectedMenuItem : ""}
                                    >
                                        Mais Recentes{" "}
                                        {sortBy === "created_desc" && (
                                            <Check style={{ marginLeft: "auto", fontSize: 16 }} />
                                        )}
                                    </MenuItem>

                                    <Divider />
                                    <div className={classes.menuHeader}>Filtrar Tags</div>
                                    <MenuItem
                                        onClick={() => handleTagOption("")}
                                        className={filterTag === "" ? classes.selectedMenuItem : ""}
                                    >
                                        Todas{" "}
                                        {filterTag === "" && <Check style={{ marginLeft: "auto", fontSize: 16 }} />}
                                    </MenuItem>
                                    {/* MAP DAS TAGS REAIS NO MENU MOBILE */}
                                    {tags.map((tag) => (
                                        <MenuItem
                                            key={tag.id}
                                            onClick={() => handleTagOption(tag.id)}
                                            className={filterTag === tag.id ? classes.selectedMenuItem : ""}
                                        >
                                            <LocalOffer
                                                style={{ fontSize: 16, marginRight: 8, color: tag.color || "#666" }}
                                            />
                                            {tag.name}
                                            {filterTag === tag.id && (
                                                <Check style={{ marginLeft: "auto", fontSize: 16 }} />
                                            )}
                                        </MenuItem>
                                    ))}
                                </>
                            )}
                        </Menu>
                    </div>
                </div>
            </MainHeader>

            {renderKPIs()}

            <Paper className={classes.mainPaper} elevation={0} onScroll={handleScroll}>
                <input
                    style={{ display: "none" }}
                    id="upload"
                    name="file"
                    type="file"
                    accept=".xls,.xlsx"
                    onChange={() => setConfirmOpen(true)}
                    ref={fileUploadRef}
                />

                {isMobile ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {sortedContacts().map((contact) => (
                            <div key={contact.id} className={classes.mobileCard}>
                                <div className={classes.mobileCardHeader}>
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                        <Checkbox
                                            checked={selectedContacts.includes(contact.id)}
                                            onChange={() => handleCheckboxChange(contact.id)}
                                            color="primary"
                                            size="small"
                                            style={{ padding: 0, marginRight: 10 }}
                                        />
                                        <Avatar
                                            src={contact.profilePicUrl}
                                            className={
                                                contact.tickets && contact.tickets.length > 0
                                                    ? classes.avatarWithBadge
                                                    : ""
                                            }
                                        />
                                        <Box ml={1.5}>
                                            <Typography
                                                variant="body1"
                                                className={classes.contactNameLink}
                                                onClick={() => handleOpenManagementModal(contact.id)}
                                            >
                                                {contact.name}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {contact.number}
                                            </Typography>
                                        </Box>
                                    </div>
                                    <IconButton size="small" onClick={() => handleOpenManagementModal(contact.id)}>
                                        <WysiwygIcon color="primary" />
                                    </IconButton>
                                </div>

                                <div className={classes.mobileCardContent}>
                                    {contact.email && <Typography variant="caption">📧 {contact.email}</Typography>}
                                    <Typography variant="caption">
                                        📅 Interação: {getDateLastMessage(contact) || "Nenhuma"}
                                    </Typography>
                                </div>

                                <div className={classes.mobileCardActions}>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color="primary"
                                        style={{ marginRight: "auto" }}
                                        onClick={() => {
                                            setContactTicket(contact);
                                            setNewTicketModalOpen(true);
                                        }}
                                        startIcon={<WhatsApp />}
                                    >
                                        Conversar
                                    </Button>
                                    <IconButton size="small" onClick={() => hadleEditContact(contact.id)}>
                                        <Edit fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        style={{ color: "#f44336" }}
                                        onClick={(e) => {
                                            setConfirmOpen(true);
                                            setDeletingContact(contact);
                                        }}
                                    >
                                        <DeleteOutline fontSize="small" />
                                    </IconButton>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <Table size="medium">
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox" align="center">
                                    <Tooltip title="Marcar Visíveis">
                                        <Checkbox
                                            color="primary"
                                            checked={selectAll}
                                            onChange={handleSelectAll}
                                            indeterminate={
                                                selectedContacts.length > 0 &&
                                                selectedContacts.length < sortedContacts().length
                                            }
                                        />
                                    </Tooltip>
                                </TableCell>
                                <TableCell style={{ fontWeight: "bold" }}>Nome</TableCell>
                                <TableCell align="center" style={{ fontWeight: "bold" }}>
                                    WhatsApp
                                </TableCell>
                                <TableCell align="center" style={{ fontWeight: "bold" }}>
                                    Email
                                </TableCell>
                                <TableCell align="center" style={{ fontWeight: "bold" }}>
                                    Última Interação
                                </TableCell>
                                <TableCell align="center" style={{ fontWeight: "bold" }}>
                                    Ações
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedContacts().map((contact) => (
                                <TableRow key={contact.id} className={classes.tableRow}>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selectedContacts.includes(contact.id)}
                                            onChange={() => handleCheckboxChange(contact.id)}
                                            color="primary"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div style={{ display: "flex", alignItems: "center" }}>
                                            <Avatar
                                                src={contact.profilePicUrl}
                                                className={
                                                    contact.tickets && contact.tickets.length > 0
                                                        ? classes.avatarWithBadge
                                                        : ""
                                                }
                                                style={{ marginRight: 15 }}
                                            />
                                            <Typography
                                                variant="body1"
                                                className={classes.contactNameLink}
                                                onClick={() => handleOpenManagementModal(contact.id)}
                                            >
                                                {contact.name}
                                            </Typography>
                                        </div>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Typography variant="body2" color="textSecondary">
                                            {contact.number}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Typography variant="body2" color="textSecondary">
                                            {contact.email}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Typography variant="caption" style={{ fontWeight: 600, color: "#888" }}>
                                            {getDateLastMessage(contact) || "-"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box display="flex" justifyContent="center">
                                            <Tooltip title="Gestão 360">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenManagementModal(contact.id)}
                                                    style={{ color: "#2196f3" }}
                                                >
                                                    <WysiwygIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Conversar">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        setContactTicket(contact);
                                                        setNewTicketModalOpen(true);
                                                    }}
                                                    style={{ color: "#4caf50" }}
                                                >
                                                    <WhatsApp />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Editar">
                                                <IconButton size="small" onClick={() => hadleEditContact(contact.id)}>
                                                    <Edit />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Mesclar">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenMergeModal(contact.id, contact.name)}
                                                    style={{ color: "#9c27b0" }}
                                                >
                                                    <ImportExport />
                                                </IconButton>
                                            </Tooltip>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    setConfirmOpen(true);
                                                    setDeletingContact(contact);
                                                }}
                                                style={{ color: "#f44336" }}
                                            >
                                                <DeleteOutline />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
                {loading && <TableRowSkeleton avatar columns={6} />}
            </Paper>
        </MainContainer>
    );
};

export default Contacts;
