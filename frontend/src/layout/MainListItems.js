import React, { useContext, useEffect, useReducer, useState } from "react";
// MUDANÇA 1: Importar NavLink em vez de Link para funcionar o 'activeClassName'
import { NavLink as RouterLink, useHistory } from "react-router-dom";
import clsx from "clsx";

import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import Divider from "@material-ui/core/Divider";
import { Badge, Collapse, List, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

// Icons Imports
import DashboardIcon from "@mui/icons-material/Dashboard";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import SyncAltIcon from "@material-ui/icons/SyncAlt";
import SettingsIcon from "@mui/icons-material/Settings";
import AutorenewIcon from "@material-ui/icons/Autorenew";
import AssessmentIcon from "@mui/icons-material/Assessment";
import PeopleAltOutlinedIcon from "@material-ui/icons/PeopleAltOutlined";
import ContactPageIcon from "@mui/icons-material/ContactPage";
import QueueIcon from "@mui/icons-material/Queue";
import QuickreplyIcon from "@mui/icons-material/Quickreply";
import HelpCenterIcon from "@mui/icons-material/HelpCenter";
import ApiIcon from "@mui/icons-material/Api";
import StyleIcon from "@mui/icons-material/Style";
import EventAvailableIcon from "@material-ui/icons/EventAvailable";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import ListIcon from "@material-ui/icons/ListAlt";
import DisplaySettingsIcon from "@mui/icons-material/DisplaySettings";
import AnnouncementIcon from "@material-ui/icons/Announcement";
import ForumIcon from "@material-ui/icons/Forum";
import PaymentsIcon from "@mui/icons-material/Payments";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import ViewKanbanIcon from "@mui/icons-material/ViewKanban";
import TaskIcon from "@mui/icons-material/Task";
import ArchiveIcon from "@mui/icons-material/Archive";
import ScheduleSendIcon from "@mui/icons-material/ScheduleSend";
import IntegrationInstructionsIcon from "@mui/icons-material/IntegrationInstructions";
import { AllInclusive } from "@material-ui/icons";

import { i18n } from "../translate/i18n";
import { WhatsAppsContext } from "../context/WhatsApp/WhatsAppsContext";
import { AuthContext } from "../context/Auth/AuthContext";
import { Can } from "../components/Can";
import { SocketContext } from "../context/Socket/SocketContext";
import { isArray } from "lodash";
import api from "../services/api";
import toastError from "../errors/toastError";
import usePlans from "../hooks/usePlans";
import useVersion from "../hooks/useVersion";

const useStyles = makeStyles((theme) => ({
    ListSubheader: {
        height: 26,
        marginTop: 15,
        marginBottom: 5,
        paddingLeft: 24,
        fontSize: "0.75rem",
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: "1px",
        color: theme.palette.text.secondary,
        lineHeight: "26px",
    },
    listItem: {
        margin: "4px 10px",
        borderRadius: "8px",
        paddingTop: 8,
        paddingBottom: 8,
        width: "80%", // Garante que respeite as margens para largura
        display: "flex",
        alignItems: "center",
        transition: "all 0.3s",
        "&:hover": {
            backgroundColor: "#038bda15",
            color: theme.palette.primary.main,
            "& .MuiListItemIcon-root": {
                color: theme.palette.primary.main,
            },
        },
        // Estilo quando a rota está ATIVA
        "&.Mui-selected": {
            backgroundColor: theme.palette.primary.main,
            color: "#FFF",
            boxShadow: "0 4px 6px #038bda30",
            "&:hover": {
                backgroundColor: "#136da1",
            },
            // MUDANÇA 1: Força o ícone a ficar branco quando ativo
            "& .MuiListItemIcon-root": {
                color: "#FFF !important",
            },
        },
    },
    listItemCentered: {
        justifyContent: "center !important",
        paddingLeft: "0 !important",
        paddingRight: "0 !important",
        "& .MuiListItemIcon-root": {
            minWidth: "auto !important",
            marginRight: 0,
        },
        "& .MuiListItemText-root": {
            display: "none",
        },
    },
    listItemIcon: {
        minWidth: 40,
        color: theme.palette.text.secondary,
        display: "flex",
        justifyContent: "center",
    },
    listItemText: {
        "& .MuiTypography-body1": {
            fontSize: "0.95rem",
            fontWeight: 500,
        },
    },
    // MUDANÇA 2: Padronização do botão Sair (mesmas margens e padding do listItem)
    logoutButton: {
        margin: "4px 10px", // Igual ao listItem
        borderRadius: "8px",
        paddingTop: 8, // Igual ao listItem
        paddingBottom: 8, // Igual ao listItem
        width: "80%", // Igual ao listItem
        marginTop: 10, // Um pequeno espaço extra acima, se desejar
        backgroundColor: theme.palette.type === "light" ? "#fee2e2" : "#7f1d1d",
        color: theme.palette.type === "light" ? "#dc2626" : "#fca5a5",
        "&:hover": {
            backgroundColor: theme.palette.type === "light" ? "#fecaca" : "#991b1b",
        },
        "& .MuiListItemIcon-root": {
            color: "inherit",
        },
    },
    versionText: {
        fontSize: "11px",
        padding: "15px",
        textAlign: "center",
        fontWeight: "bold",
        color: theme.palette.text.hint,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
    },
    versionBadge: {
        backgroundColor: theme.palette.primary.main,
        color: "white",
        fontSize: "9px",
        padding: "2px 6px",
        borderRadius: "6px",
        fontWeight: "bold",
        letterSpacing: "0.5px",
    },
}));

function ListItemLink(props) {
    const { icon, primary, to, className, collapsed } = props;
    const classes = useStyles();

    const renderLink = React.useMemo(
        () =>
            React.forwardRef((itemProps, ref) => (
                // Usando NavLink para detectar rota ativa automaticamente
                <RouterLink to={to} ref={ref} {...itemProps} activeClassName="Mui-selected" exact={to === "/"} />
            )),
        [to]
    );

    return (
        <li>
            <ListItem
                button
                component={renderLink}
                className={clsx(className || classes.listItem, {
                    [classes.listItemCentered]: collapsed,
                })}
            >
                {icon ? <ListItemIcon className={classes.listItemIcon}>{icon}</ListItemIcon> : null}
                {!collapsed && <ListItemText primary={primary} className={classes.listItemText} />}
            </ListItem>
        </li>
    );
}

const reducer = (state, action) => {
    if (action.type === "LOAD_CHATS") {
        const chats = action.payload;
        const newChats = [];

        if (isArray(chats)) {
            chats.forEach((chat) => {
                const chatIndex = state.findIndex((u) => u.id === chat.id);
                if (chatIndex !== -1) {
                    state[chatIndex] = chat;
                } else {
                    newChats.push(chat);
                }
            });
        }

        return [...state, ...newChats];
    }

    if (action.type === "UPDATE_CHATS") {
        const chat = action.payload;
        const chatIndex = state.findIndex((u) => u.id === chat.id);

        if (chatIndex !== -1) {
            state[chatIndex] = chat;
            return [...state];
        } else {
            return [chat, ...state];
        }
    }

    if (action.type === "DELETE_CHAT") {
        const chatId = action.payload;

        const chatIndex = state.findIndex((u) => u.id === chatId);
        if (chatIndex !== -1) {
            state.splice(chatIndex, 1);
        }
        return [...state];
    }

    if (action.type === "RESET") {
        return [];
    }

    if (action.type === "CHANGE_CHAT") {
        const changedChats = state.map((chat) => {
            if (chat.id === action.payload.chat.id) {
                return action.payload.chat;
            }
            return chat;
        });
        return changedChats;
    }
};

const MainListItems = (props) => {
    const classes = useStyles();
    const { drawerClose, collapsed } = props;
    const { whatsApps } = useContext(WhatsAppsContext);
    const { user, handleLogout } = useContext(AuthContext);
    const [connectionWarning, setConnectionWarning] = useState(false);
    const [openCampaignSubmenu, setOpenCampaignSubmenu] = useState(false);
    const [showCampaigns, setShowCampaigns] = useState(false);
    const [showKanban, setShowKanban] = useState(false);
    const [showOpenAi, setShowOpenAi] = useState(false);
    const [showIntegrations, setShowIntegrations] = useState(false);
    const history = useHistory();
    const [showSchedules, setShowSchedules] = useState(false);
    const [showInternalChat, setShowInternalChat] = useState(false);
    const [showExternalApi, setShowExternalApi] = useState(false);

    const [invisible, setInvisible] = useState(true);
    const [pageNumber, setPageNumber] = useState(1);
    const [searchParam] = useState("");
    const [chats, dispatch] = useReducer(reducer, []);
    const { getPlanCompany } = usePlans();

    const [version, setVersion] = useState(false);

    const { getVersion } = useVersion();

    const socketManager = useContext(SocketContext);

    useEffect(() => {
        async function fetchVersion() {
            const _version = await getVersion();
            setVersion(_version.version);
        }
        fetchVersion();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        dispatch({ type: "RESET" });
        setPageNumber(1);
    }, [searchParam]);

    useEffect(() => {
        async function fetchData() {
            try {
                const companyId = user?.companyId;
                if (!companyId) return; // Trava de segurança extra
                
                const planConfigs = await getPlanCompany(undefined, companyId);

                setShowCampaigns(planConfigs.plan.useCampaigns);
                setShowKanban(planConfigs.plan.useKanban);
                setShowOpenAi(planConfigs.plan.useOpenAi);
                setShowIntegrations(planConfigs.plan.useIntegrations);
                setShowSchedules(planConfigs.plan.useSchedules);
                setShowInternalChat(planConfigs.plan.useInternalChat);
                setShowExternalApi(planConfigs.plan.useExternalApi);
            } catch (error) {
                // Abafa o erro silenciosamente se o token estiver expirado (401)
                // O contexto de Auth já vai cuidar de redirecionar para o login
            }
        }
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchChats();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParam, pageNumber]);

    useEffect(() => {
        const companyId = localStorage.getItem("companyId");
        const socket = socketManager.getSocket(companyId);

        socket.on(`company-${companyId}-chat`, (data) => {
            if (data.action === "new-message") {
                dispatch({ type: "CHANGE_CHAT", payload: data });
            }
            if (data.action === "update") {
                dispatch({ type: "CHANGE_CHAT", payload: data });
            }
        });
        return () => {
            socket.disconnect();
        };
    }, [socketManager]);

    useEffect(() => {
        let unreadsCount = 0;
        if (chats.length > 0) {
            for (let chat of chats) {
                for (let chatUser of chat.users) {
                    if (chatUser.userId === user.id) {
                        unreadsCount += chatUser.unreads;
                    }
                }
            }
        }
        if (unreadsCount > 0) {
            setInvisible(false);
        } else {
            setInvisible(true);
        }
    }, [chats, user.id]);

    useEffect(() => {
        if (localStorage.getItem("cshow")) {
            setShowCampaigns(true);
        }
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (whatsApps.length > 0) {
                const offlineWhats = whatsApps.filter((whats) => {
                    return (
                        whats.status === "qrcode" ||
                        whats.status === "PAIRING" ||
                        whats.status === "DISCONNECTED" ||
                        whats.status === "TIMEOUT" ||
                        whats.status === "OPENING"
                    );
                });
                if (offlineWhats.length > 0) {
                    setConnectionWarning(true);
                } else {
                    setConnectionWarning(false);
                }
            }
        }, 2000);
        return () => clearTimeout(delayDebounceFn);
    }, [whatsApps]);

    const fetchChats = async () => {
        try {
            const { data } = await api.get("/chats/", {
                params: { searchParam, pageNumber },
            });
            dispatch({ type: "LOAD_CHATS", payload: data.records });
        } catch (err) {
            toastError(err);
        }
    };

    const handleClickLogout = () => {
        handleLogout();
    };

    return (
        <div onClick={drawerClose}>
            <Can
                role={user.profile}
                perform={"drawer-service-items:view"}
                style={{
                    overflowY: "scroll",
                }}
                no={() => (
                    <>
                        {!collapsed && (
                            <ListSubheader className={classes.ListSubheader} inset>
                                {i18n.t("Atendimento")}
                            </ListSubheader>
                        )}
                        <>
                            <ListItemLink
                                to="/tickets"
                                primary={i18n.t("mainDrawer.listItems.tickets")}
                                icon={<WhatsAppIcon />}
                                collapsed={collapsed}
                            />
                            <ListItemLink
                                to="/quick-messages"
                                primary={i18n.t("mainDrawer.listItems.quickMessages")}
                                icon={<QuickreplyIcon />}
                                collapsed={collapsed}
                            />
                            {showKanban && (
                                <ListItemLink
                                    to="/kanban"
                                    primary="Kanban"
                                    icon={<ViewKanbanIcon />}
                                    collapsed={collapsed}
                                />
                            )}
                            <ListItemLink
                                to="/todolist"
                                primary={i18n.t("Tarefas")}
                                icon={<TaskIcon />}
                                collapsed={collapsed}
                            />
                            <ListItemLink
                                to="/contacts"
                                primary={i18n.t("mainDrawer.listItems.contacts")}
                                icon={<ContactPageIcon />}
                                collapsed={collapsed}
                            />
                            {showSchedules && (
                                <>
                                    <ListItemLink
                                        to="/schedules"
                                        primary={i18n.t("mainDrawer.listItems.schedules")}
                                        icon={<ScheduleSendIcon />}
                                        collapsed={collapsed}
                                    />
                                </>
                            )}
                            <ListItemLink
                                to="/tags"
                                primary={i18n.t("mainDrawer.listItems.tags")}
                                icon={<StyleIcon />}
                                collapsed={collapsed}
                            />
                            {showInternalChat && (
                                <>
                                    <ListItemLink
                                        to="/chats"
                                        primary={i18n.t("mainDrawer.listItems.chats")}
                                        icon={
                                            <Badge color="secondary" variant="dot" invisible={invisible}>
                                                <ForumIcon />
                                            </Badge>
                                        }
                                        collapsed={collapsed}
                                    />
                                </>
                            )}
                            <ListItemLink
                                to="/helps"
                                primary={i18n.t("mainDrawer.listItems.helps")}
                                icon={<HelpCenterIcon />}
                                collapsed={collapsed}
                            />
                        </>
                    </>
                )}
            />

            <Can
                role={user.profile}
                perform={"drawer-admin-items:view"}
                yes={() => (
                    <>
                        {!collapsed && (
                            <ListSubheader className={classes.ListSubheader} inset>
                                {i18n.t("Gerência")}
                            </ListSubheader>
                        )}

                        <ListItemLink small to="/" primary="Dashboard" icon={<DashboardIcon />} collapsed={collapsed} />

                        <ListItemLink
                            to="/relatorios"
                            primary={i18n.t("Relátorios")}
                            icon={<AssessmentIcon />}
                            collapsed={collapsed}
                        />
                    </>
                )}
            />
            <Can
                role={user.profile}
                perform="drawer-admin-items:view"
                yes={() => (
                    <>
                        {showCampaigns && (
                            <>
                                <ListItem
                                    button
                                    onClick={() => setOpenCampaignSubmenu((prev) => !prev)}
                                    className={clsx(classes.listItem, {
                                        [classes.listItemCentered]: collapsed,
                                    })}
                                >
                                    <ListItemIcon className={classes.listItemIcon}>
                                        <EventAvailableIcon />
                                    </ListItemIcon>
                                    {!collapsed && (
                                        <>
                                            <ListItemText
                                                primary={i18n.t("mainDrawer.listItems.campaigns")}
                                                className={classes.listItemText}
                                            />
                                            {openCampaignSubmenu ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                        </>
                                    )}
                                </ListItem>
                                <Collapse
                                    style={{ paddingLeft: collapsed ? 0 : 15 }}
                                    in={openCampaignSubmenu}
                                    timeout="auto"
                                    unmountOnExit
                                >
                                    <List component="div" disablePadding>
                                        <ListItem
                                            onClick={() => history.push("/campaigns")}
                                            button
                                            className={clsx(classes.listItem, {
                                                [classes.listItemCentered]: collapsed,
                                            })}
                                        >
                                            <ListItemIcon className={classes.listItemIcon}>
                                                <ListIcon />
                                            </ListItemIcon>
                                            {!collapsed && (
                                                <ListItemText primary="Listagem" className={classes.listItemText} />
                                            )}
                                        </ListItem>

                                        <ListItem
                                            onClick={() => history.push("/contact-lists")}
                                            button
                                            className={clsx(classes.listItem, {
                                                [classes.listItemCentered]: collapsed,
                                            })}
                                        >
                                            <ListItemIcon className={classes.listItemIcon}>
                                                <PeopleAltIcon />
                                            </ListItemIcon>
                                            {!collapsed && (
                                                <ListItemText
                                                    primary="Listas de Contatos"
                                                    className={classes.listItemText}
                                                />
                                            )}
                                        </ListItem>

                                        <ListItem
                                            onClick={() => history.push("/campaigns-config")}
                                            button
                                            className={clsx(classes.listItem, {
                                                [classes.listItemCentered]: collapsed,
                                            })}
                                        >
                                            <ListItemIcon className={classes.listItemIcon}>
                                                <DisplaySettingsIcon />
                                            </ListItemIcon>
                                            {!collapsed && (
                                                <ListItemText
                                                    primary="Configurações"
                                                    className={classes.listItemText}
                                                />
                                            )}
                                        </ListItem>
                                    </List>
                                </Collapse>
                            </>
                        )}

                        {!collapsed && (
                            <ListSubheader className={classes.ListSubheader} inset>
                                {i18n.t("Administração")}
                            </ListSubheader>
                        )}

                        {user.super && (
                            <ListItemLink
                                to="/announcements"
                                primary={i18n.t("mainDrawer.listItems.annoucements")}
                                icon={<AnnouncementIcon />}
                                collapsed={collapsed}
                            />
                        )}

                        {showOpenAi && (
                            <ListItemLink
                                to="/prompts"
                                primary={i18n.t("mainDrawer.listItems.prompts")}
                                icon={<AllInclusive />}
                                collapsed={collapsed}
                            />
                        )}

                        {showIntegrations && (
                            <ListItemLink
                                to="/queue-integration"
                                primary={i18n.t("mainDrawer.listItems.queueIntegration")}
                                icon={<IntegrationInstructionsIcon />}
                                collapsed={collapsed}
                            />
                        )}
                        <ListItemLink
                            to="/connections"
                            primary={i18n.t("mainDrawer.listItems.connections")}
                            icon={
                                <Badge badgeContent={connectionWarning ? "!" : 0} color="error">
                                    <SyncAltIcon />
                                </Badge>
                            }
                            collapsed={collapsed}
                        />
                        <ListItemLink
                            to="/files"
                            primary={i18n.t("mainDrawer.listItems.files")}
                            icon={<ArchiveIcon />}
                            collapsed={collapsed}
                        />
                        <ListItemLink
                            to="/queues"
                            primary={i18n.t("mainDrawer.listItems.queues")}
                            icon={<QueueIcon />}
                            collapsed={collapsed}
                        />
                        <ListItemLink
                            to="/users"
                            primary={i18n.t("mainDrawer.listItems.users")}
                            icon={<PeopleAltOutlinedIcon />}
                            collapsed={collapsed}
                        />
                        {showExternalApi && (
                            <>
                                <ListItemLink
                                    to="/messages-api"
                                    primary={i18n.t("mainDrawer.listItems.messagesAPI")}
                                    icon={<ApiIcon />}
                                    collapsed={collapsed}
                                />
                            </>
                        )}
                        <ListItemLink
                            to="/financeiro"
                            primary={i18n.t("mainDrawer.listItems.financeiro")}
                            icon={<PaymentsIcon />}
                            collapsed={collapsed}
                        />

                        <ListItemLink
                            to="/settings"
                            primary={i18n.t("mainDrawer.listItems.settings")}
                            icon={<SettingsIcon />}
                            collapsed={collapsed}
                        />

                        {user.super && !collapsed && (
                            <ListSubheader className={classes.ListSubheader} inset>
                                {i18n.t("Sistema")}
                            </ListSubheader>
                        )}
                        {user.super && (
                            <ListItemLink
                                to="/LogLauncher"
                                primary={i18n.t("mainDrawer.listItems.loglauncher")}
                                icon={<AutorenewIcon />}
                                collapsed={collapsed}
                            />
                        )}

                        {!collapsed && (
                            <React.Fragment>
                                <Divider />
                                <Typography className={classes.versionText}>
                                    {`${version}`}
                                    <span className={classes.versionBadge}>latest</span>
                                </Typography>
                            </React.Fragment>
                        )}
                    </>
                )}
            />
            <Divider />
            <li>
                <ListItem
                    button
                    dense
                    onClick={handleClickLogout}
                    className={clsx(classes.logoutButton, {
                        [classes.listItemCentered]: collapsed,
                    })}
                >
                    <ListItemIcon className={classes.listItemIcon}>
                        <ExitToAppIcon />
                    </ListItemIcon>
                    {!collapsed && <ListItemText primary={i18n.t("Sair")} className={classes.listItemText} />}
                </ListItem>
            </li>
        </div>
    );
};

export default MainListItems;
