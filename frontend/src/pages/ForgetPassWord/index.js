import React, { useState, useEffect } from "react";
import qs from "query-string";
import IconButton from "@material-ui/core/IconButton";
import Visibility from "@material-ui/icons/Visibility";
import VisibilityOff from "@material-ui/icons/VisibilityOff";
import InputAdornment from "@material-ui/core/InputAdornment";
import * as Yup from "yup";
import { useHistory, Link as RouterLink } from "react-router-dom";
import { Formik, Form, Field } from "formik";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import TextField from "@material-ui/core/TextField";
import Link from "@material-ui/core/Link";
import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import { toast } from "react-toastify";
import toastError from "../../errors/toastError";
import "react-toastify/dist/ReactToastify.css";

const useStyles = makeStyles((theme) => ({
    root: {
        display: "flex",
        flexDirection: "row",
        height: "100vh",
        "@media (max-width: 600px)": {
            flexDirection: "column",
        },
    },
    leftSide: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // Ajuste Mobile First: Topo ocupa apenas 17vh
        "@media (max-width: 600px)": {
            justifyContent: "left",
            paddingLeft: 30,
            flex: "0 0 auto",
            height: "0vh",
            width: "100vw",
            backgroundColor: "#FFFFFF",
            padding: 10,
        },
    },
    rightSide: {
        flex: 1,
        backgroundImage: `url(${process.env.REACT_APP_BACKEND_URL}/public/logotipos/background.png)`,
        backgroundColor: "#00BFA510",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // Ajuste Mobile First: Área do form ocupa o restante (83vh)
        "@media (max-width: 600px)": {
            height: "83vh",
            width: "100vw",
        },
    },
    paper: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "#F1F0F0",
        padding: "30px 20px",
        borderRadius: "25px",
        width: "100%",
        maxWidth: "450px",
        boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
        "@media (max-width: 600px)": {
            boxShadow: "none", // Remove sombra no mobile para parecer nativo
            padding: "20px",
        },
    },
    form: {
        width: "100%",
        marginTop: theme.spacing(1),
    },
    inputField: {
        margin: theme.spacing(2, 0),
        "& input": {
            padding: "10px 0",
        },
        "& .MuiInput-underline:before": {
            borderBottom: "2px solid #ccc",
        },
        "& .MuiInput-underline:hover:before": {
            borderBottom: "2px solid #000",
        },
        "& .MuiInput-underline:after": {
            borderBottom: "2px solid #2575fc",
        },
    },
    submit: {
        margin: theme.spacing(3, 0, 2),
        borderRadius: "15px",
        padding: "10px",
        fontSize: "1rem",
        fontWeight: "bold",
    },
    link: {
        marginTop: theme.spacing(2),
        marginBottom: theme.spacing(2),
        textDecoration: "none",
        color: theme.palette.primary.main,
        fontWeight: 600,
        "&:hover": {
            textDecoration: "underline",
        },
    },
    logo: {
        width: "100%",
        maxWidth: "100%",
        height: "auto",
    },
    logoMobile: {
        height: "10%", // Ocupa a altura do container (15vh)
        width: "12vw",
        maxWidth: "100%",
        objectFit: "contain", // Garante que a logo não distorça
        marginBottom: "20px",
        "@media (max-width: 600px)": {
            height: "10%", // Ocupa a altura do container (15vh)
            width: "40vw",
            maxWidth: "100%",
            objectFit: "contain", // Garante que a logo não distorça
            marginBottom: "10px",
        },
    },
    title: {
        fontSize: "1.8rem",
        fontWeight: 700,
        color: "#333",
        marginBottom: theme.spacing(2),
        textAlign: "center",
        "@media (max-width: 600px)": {
            fontSize: "1.5rem", // Reduz um pouco no mobile
        },
    },
    subTitle: {
        color: "#666",
        marginBottom: theme.spacing(3),
        textAlign: "center",
        fontSize: "0.9rem",
    },
}));

const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

const ForgetPassword = () => {
    const classes = useStyles();
    const history = useHistory();
    const [showAdditionalFields, setShowAdditionalFields] = useState(false);
    const [showResetPasswordButton, setShowResetPasswordButton] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const toggleAdditionalFields = () => {
        setShowAdditionalFields(!showAdditionalFields);
        if (showAdditionalFields) {
            setShowResetPasswordButton(false);
        } else {
            setShowResetPasswordButton(true);
        }
    };

    const handleSendEmail = async (values) => {
        const email = values.email;
        try {
            const response = await api.post(`${process.env.REACT_APP_BACKEND_URL}/forgetpassword/${email}`);
            if (response.data.status === 404) {
                toast.error("Email não encontrado");
            } else {
                toast.success(i18n.t("Email enviado com sucesso!"));
                toggleAdditionalFields(); // Avança para os campos de token
            }
        } catch (err) {
            console.log("API Error:", err);
            toastError(err);
        }
    };

    const handleResetPassword = async (values) => {
        const email = values.email;
        const token = values.token;
        const newPassword = values.newPassword;
        const confirmPassword = values.confirmPassword;

        if (newPassword === confirmPassword) {
            try {
                await api.post(`${process.env.REACT_APP_BACKEND_URL}/resetpasswords/${email}/${token}/${newPassword}`);
                setError("");
                toast.success(i18n.t("Senha redefinida com sucesso."));
                history.push("/login");
            } catch (err) {
                console.log(err);
                toastError(err);
            }
        } else {
            setError("As senhas não correspondem");
        }
    };

    const isResetPasswordButtonClicked = showResetPasswordButton;

    const UserSchema = Yup.object().shape({
        email: Yup.string().email("Email inválido").required("Obrigatório"),
        newPassword: isResetPasswordButtonClicked
            ? Yup.string()
                  .required("Campo obrigatório")
                  .matches(
                      passwordRegex,
                      "Sua senha precisa ter no mínimo 8 caracteres, sendo uma letra maiúscula, uma minúscula e um número."
                  )
            : Yup.string(),
        confirmPassword: Yup.string().when("newPassword", {
            is: (newPassword) => isResetPasswordButtonClicked && newPassword,
            then: Yup.string()
                .oneOf([Yup.ref("newPassword"), null], "As senhas não correspondem")
                .required("Campo obrigatório"),
            otherwise: Yup.string(),
        }),
    });

    const logo = `${process.env.REACT_APP_BACKEND_URL}/public/logotipos/login.png`;
    const logoMobile = `${process.env.REACT_APP_BACKEND_URL}/public/logotipos/interno.png`;
    const randomValue = Math.random();
    const logoWithRandom = `${logo}?r=${randomValue}`;
    const logoMobileWithRandom = `${logoMobile}?r=${randomValue}`;

    return (
        <div className={classes.root}>
            <div className={classes.leftSide}>
                <img
                    className={windowWidth <= 600 ? classes.logoMobile : classes.logo}
                    src={windowWidth <= 600 ? logoMobileWithRandom : logoWithRandom}
                    alt={`${process.env.REACT_APP_NAME_SYSTEM}`}
                />
            </div>
            <div className={classes.rightSide}>
                <Container component="main" maxWidth="xs">
                    <CssBaseline />
                    <div className={classes.paper}>
                        <img
                          className={windowWidth <= 600 ? classes.logoMobile : classes.logoMobile}
                          src={logoMobileWithRandom}
                          alt={`${process.env.REACT_APP_NAME_SYSTEM}`}
                        />
                        <Typography component="h1" variant="h5" className={classes.title}>
                            {showAdditionalFields ? "Redefinir Senha" : "Recuperar Conta"}
                        </Typography>
                        <Typography variant="body2" className={classes.subTitle}>
                            {showAdditionalFields
                                ? "Insira o código enviado ao seu e-mail e sua nova senha."
                                : "Digite seu e-mail para receber o código de verificação."}
                        </Typography>

                        <Formik
                            initialValues={{
                                email: "",
                                token: "",
                                newPassword: "",
                                confirmPassword: "",
                            }}
                            enableReinitialize={true}
                            validationSchema={UserSchema}
                            onSubmit={(values, actions) => {
                                setTimeout(() => {
                                    if (showResetPasswordButton) {
                                        handleResetPassword(values);
                                    } else {
                                        handleSendEmail(values);
                                    }
                                    actions.setSubmitting(false);
                                }, 400);
                            }}
                        >
                            {({ touched, errors, isSubmitting }) => (
                                <Form className={classes.form}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <Field
                                                as={TextField}
                                                variant="standard"
                                                fullWidth
                                                id="email"
                                                label={i18n.t("signup.form.email")}
                                                name="email"
                                                error={touched.email && Boolean(errors.email)}
                                                helperText={touched.email && errors.email}
                                                autoComplete="email"
                                                required
                                                className={classes.inputField}
                                                disabled={showAdditionalFields}
                                            />
                                        </Grid>

                                        {showAdditionalFields && (
                                            <>
                                                <Grid item xs={12}>
                                                    <Field
                                                        as={TextField}
                                                        variant="standard"
                                                        fullWidth
                                                        id="token"
                                                        label="Código de Verificação"
                                                        name="token"
                                                        error={touched.token && Boolean(errors.token)}
                                                        helperText={touched.token && errors.token}
                                                        autoComplete="off"
                                                        required
                                                        className={classes.inputField}
                                                    />
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <Field
                                                        as={TextField}
                                                        variant="standard"
                                                        fullWidth
                                                        type={showPassword ? "text" : "password"}
                                                        id="newPassword"
                                                        label="Nova senha"
                                                        name="newPassword"
                                                        error={touched.newPassword && Boolean(errors.newPassword)}
                                                        helperText={touched.newPassword && errors.newPassword}
                                                        autoComplete="off"
                                                        required
                                                        className={classes.inputField}
                                                        InputProps={{
                                                            endAdornment: (
                                                                <InputAdornment position="end">
                                                                    <IconButton onClick={togglePasswordVisibility}>
                                                                        {showPassword ? (
                                                                            <Visibility />
                                                                        ) : (
                                                                            <VisibilityOff />
                                                                        )}
                                                                    </IconButton>
                                                                </InputAdornment>
                                                            ),
                                                        }}
                                                    />
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <Field
                                                        as={TextField}
                                                        variant="standard"
                                                        fullWidth
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        id="confirmPassword"
                                                        label="Confirme a senha"
                                                        name="confirmPassword"
                                                        error={
                                                            touched.confirmPassword && Boolean(errors.confirmPassword)
                                                        }
                                                        helperText={touched.confirmPassword && errors.confirmPassword}
                                                        autoComplete="off"
                                                        required
                                                        className={classes.inputField}
                                                        InputProps={{
                                                            endAdornment: (
                                                                <InputAdornment position="end">
                                                                    <IconButton
                                                                        onClick={toggleConfirmPasswordVisibility}
                                                                    >
                                                                        {showConfirmPassword ? (
                                                                            <Visibility />
                                                                        ) : (
                                                                            <VisibilityOff />
                                                                        )}
                                                                    </IconButton>
                                                                </InputAdornment>
                                                            ),
                                                        }}
                                                    />
                                                </Grid>
                                            </>
                                        )}
                                    </Grid>

                                    {error && (
                                        <Box mt={2}>
                                            <Typography variant="body2" color="error" align="center">
                                                {error}
                                            </Typography>
                                        </Box>
                                    )}

                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        color="primary"
                                        className={classes.submit}
                                        disabled={isSubmitting}
                                    >
                                        {showResetPasswordButton ? "Redefinir Senha" : "Enviar Código"}
                                    </Button>

                                    <Grid container justifyContent="center">
                                        <Grid item>
                                            <Link
                                                component={RouterLink}
                                                to="/login"
                                                variant="body2"
                                                className={classes.link}
                                            >
                                                Voltar para o Login
                                            </Link>
                                        </Grid>
                                    </Grid>
                                </Form>
                            )}
                        </Formik>
                    </div>
                </Container>
            </div>
        </div>
    );
};

export default ForgetPassword;
