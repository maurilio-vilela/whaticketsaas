import React, { useState, useEffect } from "react";
import qs from "query-string";
import * as Yup from "yup";
import { useHistory } from "react-router-dom";
import { Link as RouterLink } from "react-router-dom";
import { toast } from "react-toastify";
import { Formik, Form, Field } from "formik";
import usePlans from "../../hooks/usePlans";
import api from "../../services/api";
import {
  Container,
  TextField,
  Grid,
  Button,
  Select,
  MenuItem,
  InputLabel,
  CssBaseline,
  Link,
  Box,
} from "@material-ui/core";
import InputMask from "react-input-mask";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import { i18n } from "../../translate/i18n";
import { openApi } from "../../services/api";
import toastError from "../../errors/toastError";
import moment from "moment";

const useStyles = makeStyles((theme) => ({
  paper: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
  },
  root: {
    display: "flex",
    height: "100vh",
  },
  formContainer: {
    width: "50%",
    padding: theme.spacing(4),
    overflowY: "auto",
    overflow: "hidden",
    scrollbarWidth: "none", /* Para Firefox */
    "-ms-overflow-style": "none", /* Para IE e Edge */
    "&::-webkit-scrollbar": {
      display: "none" /* Para Chrome, Safari e Edge */
    },
    [theme.breakpoints.down(948)]: {
      width: "100%", // Ocupa toda a tela abaixo de 948px
    },
  },
  imageContainer: {
    width: "50%",
    backgroundImage: `url(${process.env.REACT_APP_BACKEND_URL}/public/logotipos/signup.png)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    [theme.breakpoints.down(948)]: {
      display: "none", // Oculta abaixo de 948px
    },
  },
  inputLabel: {
    fontSize: "0.75em",
    marginTop: "8px",
    marginBottom: "8px",
  },
  form: {
    marginTop: theme.spacing(3),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

const UserSchema = Yup.object().shape({
  name: Yup.string().min(2, "Too Short!").max(50, "Too Long!").required("Required"),
  password: Yup.string().min(5, "Too Short!").max(50, "Too Long!"),
  email: Yup.string().email("Invalid email").required("Required"),
});

const SignUp = () => {
  const classes = useStyles();
  const history = useHistory();
  const [allowregister, setallowregister] = useState("enabled");
  const [trial, settrial] = useState("3");
  let companyId = null;

  useEffect(() => {
    fetchallowregister();
    fetchtrial();
  }, []);

  const fetchtrial = async () => {
    try {
      const response = await api.get("/settings/trial");
      settrial(response.data.value);
    } catch (error) {
      console.error("Error retrieving trial", error);
    }
  };

  const fetchallowregister = async () => {
    try {
      const response = await api.get("/settings/allowregister");
      setallowregister(response.data.value);
    } catch (error) {
      console.error("Error retrieving allowregister", error);
    }
  };

  if (allowregister === "disabled") {
    history.push("/login");
  }

  const params = qs.parse(window.location.search);
  if (params.companyId !== undefined) {
    companyId = params.companyId;
  }

  const initialState = { name: "", email: "", phone: "", password: "", planId: "disabled" };
  
  const [user] = useState(initialState);
  const dueDate = moment().add(trial, "day").format();

  const handleSignUp = async (values) => {
    Object.assign(values, { recurrence: "MENSAL", dueDate, status: "t", campaignsEnabled: true });
    try {
      await openApi.post("/companies/cadastro", values);
      toast.success(i18n.t("signup.toasts.success"));
      history.push("/login");
    } catch (err) {
      toastError(err);
    }
  };

  const [plans, setPlans] = useState([]);
  const { register: listPlans } = usePlans();

  useEffect(() => {
    async function fetchData() {
      const list = await listPlans();
      setPlans(list);
    }
    fetchData();
  }, []);
  
  const logo = `${process.env.REACT_APP_BACKEND_URL}/public/logotipos/interno.png`;
  const randomValue = Math.random();
  const logoWithRandom = `${logo}?r=${randomValue}`;

  return (
    <div className={classes.root}>
      <CssBaseline />
      <div className={classes.formContainer}>
        <Container maxWidth="xs">
			<div className={classes.paper}>
				<img style={{ width: "185px" }} src={logoWithRandom} alt="Logo" />
				<Typography component="h1" variant="h5">
					<Box sx={{ fontWeight: 'bold', fontSize: 34, textAlign: 'center', color: '#00bfa5', mt: 2.25, mb: 2.25}}> 
					⚡ Cadastre-se 
					</Box>
				</Typography>
				<Typography variant="body2" color="textSecondary" align="left">
					💬 Automatize seu atendimento ao cliente no WhatsApp com a Dialogix. Inicie hoje seu {" "}
                	<Typography component="span" style={{ fontWeight: "bold" }}>
                		teste GRÁTIS
                	</Typography>{" "} de 7 dias. Chatbot WhatsApp, Multiusuário e mais.
				</Typography>
			</div>
          <Formik
              initialValues={user}
              validationSchema={UserSchema}
              onSubmit={handleSignUp}
            >
              {({ touched, errors }) => {
                return (
                  <Form className={classes.form}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <InputLabel htmlFor="name" className={classes.inputLabel}>
                          Nome da Empresa
                        </InputLabel>
                        <Field
                          as={TextField}
                          autoComplete="name"
                          name="name"
                          variant="outlined"
                          fullWidth
                          id="name"
                          placeholder="Digite o nome da empresa"
                          error={touched.name && Boolean(errors.name)}
                          helperText={touched.name && errors.name}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <InputLabel htmlFor="email" className={classes.inputLabel}>
                          Email
                        </InputLabel>
                        <Field
                          as={TextField}
                          variant="outlined"
                          fullWidth
                          id="email"
                          label={i18n.t("signup.form.email")}
                          name="email"
                          autoComplete="email"
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <InputLabel htmlFor="phone" className={classes.inputLabel}>
                          Telefone
                        </InputLabel>
                        <Field
                          as={InputMask}
                          mask="(99) 99999-9999"
                          variant="outlined"
                          fullWidth
                          id="phone"
                          name="phone"
                        >
                          {({ field }) => <TextField {...field} variant="outlined" fullWidth placeholder="(99) 99999-9999" />}
                        </Field>
                      </Grid>
                      <Grid item xs={12}>
                        <InputLabel htmlFor="password" className={classes.inputLabel}>
                          Senha
                        </InputLabel>
                        <Field
                          as={TextField}
                          variant="outlined"
                          fullWidth
                          name="password"
                          label={i18n.t("signup.form.password")}
                          type="password"
                          id="password"
                          autoComplete="current-password"
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <InputLabel htmlFor="plan-selection" className={classes.inputLabel}>
                          Plano
                        </InputLabel>
                        <Field as={Select} variant="outlined" fullWidth id="plan-selection" name="planId" required>
                          <MenuItem value="disabled" disabled>
                            <em>Selecione seu plano de assinatura</em>
                          </MenuItem>
                          {plans.map((plan, key) => (
                            <MenuItem key={key} value={plan.id}>
                              {plan.name} - {plan.connections} WhatsApps - {plan.users} Usuários - R${" "}
                              {plan.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </MenuItem>
                          ))}
                        </Field>
                      </Grid>
                    </Grid>
                    <Button type="submit" fullWidth variant="contained" color="primary" className={classes.submit}>
                      {i18n.t("signup.buttons.submit")}
                    </Button>
                  </Form>
                );
              }}
            </Formik>

          <Typography variant="body2" color="success.main">
              <Box sx={{mb: 1,}}> 
                  <Link href="#" variant="body2" component={RouterLink} to="/login">
                    Já tem uma conta?
                  </Link>
              </Box>
          </Typography>
          <div className={classes.paper}>            
            <Typography variant="body2" color="textSecondary" align="center">
            {"Copyright © "}
            <Link color="inherit" href="https://www.dialogix.com.br/">
              Dialogix
            </Link>{" "}{new Date().getFullYear()}
            {"."}
            </Typography>
            <Typography variant="body2" color="textSecondary" align="center">
              This site is protected by reCAPTCHA Enterprise and the Google <Link href="https://policies.google.com/privacy">Privacy Policy</Link> and <Link href="https://policies.google.com/terms">Terms of Service</Link>
            </Typography>
          </div>
        </Container>
      </div>
      <div className={classes.imageContainer} />
    </div>
  );
};

export default SignUp;
