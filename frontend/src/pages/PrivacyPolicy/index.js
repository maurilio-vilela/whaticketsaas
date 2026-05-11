import React from "react";
import { Container, Typography, Box } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: theme.spacing(4),
    padding: theme.spacing(4),
    maxWidth: "80vw",
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
  },
  title: {
    fontWeight: "bold",
    fontSize: "24px",
    marginBottom: theme.spacing(2),
    textTransform: "uppercase",
  },
  section: {
    marginBottom: theme.spacing(3),
  },
  text: {
    fontSize: "16px",
    color: "#555",
    marginBottom: "12px",
  },
}));

const PrivacyPolicy = () => {
  const classes = useStyles();

  return (
    <Container className={classes.container}>
      <Typography className={classes.title} variant="h4"  fontWeight="bold">
        Política de Privacidade e Cookies
      </Typography>

      <Box className={classes.section}>
        <Typography className={classes.text}>
          Bem-vindo à nossa Política de Privacidade. Seu direito à privacidade é muito importante para nós. Esta página descreve como coletamos, usamos e protegemos suas informações.
        </Typography>
      </Box>

      <Box className={classes.section}>
        <Typography variant="h6">
        <Box sx={{ textTransform: 'uppercase', fontWeight:'bold'}}> 
          1. Dados do responsável pelo uso dos dados
        </Box>
        </Typography>
        <Typography className={classes.text}>
         1.1 Designação comercial: M DE O VILELA SERVIÇOS E TECNOLOGIA
        </Typography>
        <Typography className={classes.text}>
         1.2 CNPJ: 20.164.388/0001-73
        </Typography>
        <Typography className={classes.text}>
         1.3 Sede:Rua Niterói, 52, Chácara Brasil, São Luís, Maranhão
        </Typography>
        <Typography className={classes.text}>
         1.4 E-mail de contato: maurilio.vilela@vilelatech.com.br
        </Typography>
        <Typography className={classes.text}>
         1.5 Finalidade da página web: Informação, suporte e operação dos serviços para clientes e interessados.
        </Typography>
      </Box>

      <Box className={classes.section}>
        <Typography variant="h6">
        <Box sx={{ textTransform: 'uppercase', fontWeight:'bold'}}> 
          2. PROTEÇÃO DE DADOS PESSOAIS
        </Box>
        </Typography>
        <Typography className={classes.text}>
          2.1. QUE INFORMAÇÃO NÓS PROCESSAMOS?
        </Typography>
        <Typography className={classes.text}>
          2.1.1 Identificadores como nome, e-mail e número de telefone.
        </Typography>
        <Typography className={classes.text}>
          2.1.2 Dados comerciais, como o nome de sua empresa.
        </Typography>
        <Typography className={classes.text}>
          2.1.3 Dados relacionados ao uso que você da aos nossos produtos ou serviços, incluído todo comentário ou sugestão que nos envie.
        </Typography>
        <Typography className={classes.text}>
          2.2. COMO OBTEMOS SUA INFORMAÇÃO?
        </Typography>
        <Typography className={classes.text}>
          2.2.1 A maior parte da informação que processamos você mesmo nos proporciona diretamente por algum dos seguintes motivos:
        </Typography>
        <Typography className={classes.text}>
          2.2.1.1 Você nos fez alguma solicitação de acesso a sua informação
        </Typography>
        <Typography className={classes.text}>
          2.2.1.2 Você nos manifestou que deseja receber informação promocional sobre nossos produtos e os de nossos sócios comerciais.
        </Typography>
        <Typography className={classes.text}>
          2.2.1.3 Você contratou nossos produtos ou serviços e nos proporcionou informação necessária para que pudéssemos prestar tais incumbências.
        </Typography>
        <Typography className={classes.text}>
          2.2.1.4 Através de Cookies, quando usa nosso site (você pode ler mais sobre isso na seção 3 desse documento)
        </Typography>
        <Typography className={classes.text}>
          2.3. COMO VAMOS USAR SEUS DADOS?    
        </Typography>
        <Typography className={classes.text}>
          2.3.1 No DIALOGIX processaremos seus dados para:
        </Typography>
        <Typography className={classes.text}>
          2.3.2 Gerir sua conta e a prestação de nossos produtos e serviços.
        </Typography>
        <Typography className={classes.text}>
          2.3.3 Enviar-lhe informação promocional sobre nossos produtos e serviços..
        </Typography>
        <Typography className={classes.text}>
          2.3.4 Dar seguimento a nosso processo de vendas.
        </Typography>
        <Typography className={classes.text}>
          2.3.5 Fins estatísticos relacionados a nossos produtos e serviços.
        </Typography>
        <Typography className={classes.text}>
          2.3.6 Além disso, se você estiver de acordo, seus dados serão eventualmente processados por nossos parceiros comerciais nos casos explicados no ponto 2.5.
        </Typography>
        <Typography className={classes.text}>
          2.4. COMO ARMAZENAMOS SUA INFORMAÇÃO E POR QUANTO TEMPO A RETEMOS?
        </Typography>
        <Typography className={classes.text}>
          2.4.1 No DIALOGIX armazenamos seus dados de modo seguro nos Estados Unidos, Peru e Brasil cumprindo nossas instalações e provedores de serviços de armazenamento nesses países, conforme corresponda, com os padrões atuais de segurança da informação, que revisamos e atualizamos periodicamente.
        </Typography>
        <Typography className={classes.text}>
          2.4.2 Ao aceitar esta política de privacidade e cookies, você autoriza a transferência dos seus dados para processamento seguro.
        </Typography>
        <Typography className={classes.text}>
          2.4.3 A respeito do período de retenção de seus dados, será conforme à finalidade original para a qual foram coletados. Por exemplo, armazenaremos seus dados enquanto você tiver uma conta ativa em nosso site e / ou for nosso cliente, e por um período razoável depois que essas condições não existam mais. Este período razoável inclui o tempo necessário para que no DIALOGIX sejam realizadas auditorias, cumpramos as obrigações legais, resolvamos disputas e garantamos o cumprimento de nossos contratos.
        </Typography>
        <Typography className={classes.text}>
          2.5. QUANDO E DE QUE MANEIRA COMPARTILHAREMOS SUA INFORMAÇÃO COM TERCEIROS?
        </Typography>
        <Typography className={classes.text}>
          2.5.1 É possível que compartilhemos a informação que você nos fornece com terceiros. Fique tranquilo, tudo o que compartilhamos o fazemos no contexto de uma relação contratual com esses terceiros, ou por obrigações legais ou contratuais específicas que exijam isso.
        </Typography>
        <Typography className={classes.text}>
          2.5.2 É possível que compartilhemos sua informação pessoal da seguinte maneira:
        </Typography>
        <Typography className={classes.text}>
          2.5.2.1 Para prestadores de serviços que permitem nosso site e nossos produtos e serviços são fornecidos corretamente, como Amazon, Google, Stripe, Notion.
        </Typography>
        <Typography className={classes.text}>
          2.5.2.2 Todos os nossos provedores estão contratualmente obrigados a manter a confidencialidade dos dados que processam e só podem processá-los para os fins que estabelecemos.
        </Typography>
        <Typography className={classes.text}>
          2.5.2.3 Para o comprador ou sucessor dos produtos ou serviços prestados por DIALOGIX no caso de uma fusão, reestruturação, reorganização ou qualquer outra variação corporativa. Nestes casos, você será notificado por meio do e-mail com o qual se registrou ou visivelmente em nosso site sobre qualquer alteração deste tipo.
        </Typography>
        <Typography className={classes.text}>
          2.5.2.4 No âmbito de um processo judicial ou administrativo, quando assim seja exigido pela autoridade competente.
        </Typography>
        <Typography className={classes.text}>
          2.5.2.5 Para o cumprimento de nossos Termos e Condições e outras obrigações relacionadas aos produtos ou serviços adquiridos através do nosso site, como faturamento e cobrança.
        </Typography>
        <Typography className={classes.text}>
          2.5.2.6 Para outros fins especificados no momento da solicitação de informação feita a você.
        </Typography>
        <Typography className={classes.text}>
          2.5.3 Com seu consentimento DIALOGIX pode divulgar a terceiros sua informação anônima que não contenha dados pessoais.
        </Typography>
        <Typography className={classes.text}>
          2.6. MARKETING
        </Typography>
        <Typography className={classes.text}>
          2.6.1 Se você estiver devidamente de acordo, usaremos seus dados para lhe enviar informações promocionais sobre nossos produtos e serviços, assim como de nossos parceiros comerciais, que acreditamos que possam lhe interessar.
        </Typography>
        <Typography className={classes.text}>
          2.6.2 Lembre-se de que você sempre pode nos escrever para que deixemos de lhe enviar publicidade.
        </Typography>
        <Typography className={classes.text}>
          2.7. QUAIS SÃO MEUS DIREITOS?
        </Typography>
        <Typography className={classes.text}>
          2.7.1 Lembre-se de que você pode exercer certos direitos em relação aos seus dados, que são os seguintes:
        </Typography>
        <Typography className={classes.text}>
          2.7.2 DIREITO DE ACESSO
        </Typography>
        <Typography className={classes.text}>
          2.7.2.1 Você tem o direito de nos solicitar cópias de todas as suas informações que constem em nossos registros. É possível que certas informações estejam isentas deste direito e, nesse caso, informaremos que há algumas informações que não podemos fornecer e o porquê.
        </Typography>
        <Typography className={classes.text}>
          2.7.3 DIREITO DE RETIFICAÇÃO
        </Typography>
        <Typography className={classes.text}>
          2.7.3.1 Você tem o direito de nos pedir para corrigir qualquer informação pessoal que você acredita ser imprecisa. Você também tem o direito de solicitar que completemos qualquer informação pessoal sua que acredite estar incompleta.
        </Typography>
        <Typography className={classes.text}>
          2.7.4 DIREITO DE SUPRESSÃO
        </Typography>
        <Typography className={classes.text}>
          2.7.4.1 Você tem o direito de nos solicitar a remoção de todas as suas informações existentes em nossos registros em determinadas circunstâncias. Se houver uma impossibilidade legal de eliminar todas as suas informações, nós o informaremos.
        </Typography>
        <Typography className={classes.text}>
          2.7.5 DIREITO DE LIMITAÇÃO
        </Typography>
        <Typography className={classes.text}>
          2.7.5.1 Em certos casos, como durante o processo de retificação de suas informações, você pode solicitar que limitemos o processamento de suas informações.
        </Typography>
        <Typography className={classes.text}>
          2.7.6 DIREITO DE OPOSIÇÃO
        </Typography>
        <Typography className={classes.text}>
          2.7.6.1 Você pode se opor a que nós processemos seus dados mesmo quando estamos autorizados por lei a fazê-lo, por motivos relacionados à sua situação particular.
        </Typography>
        <Typography className={classes.text}>
          2.7.7 DIREITO À PORTABILIDADE DOS DADOS
        </Typography>
        <Typography className={classes.text}>
          2.7.7.1 Você pode nos pedir que transfiramos todas as suas informações que tenhamos para outra empresa, se possível, ou mesmo que nós a forneçamos diretamente a você.
        </Typography>
        <Typography className={classes.text}>
          2.7.8 Todos estes direitos podem ser exercidos de forma gratuita.
        </Typography>
        <Typography className={classes.text}>
          2.7.9 Se você deseja exercer algum desses direitos, não hesite em nos contatar ou escrever diretamente para o nosso Responsável de Proteção de Dados.
        </Typography>
        <Typography className={classes.text}>
          2.8. MUDANÇAS EM NOSSA POLÍTICA DE PRIVACIDADE
        </Typography>
        <Typography className={classes.text}>
          2.8.1 No Dialogix, revisamos continuamente nossas práticas e políticas de privacidade e publicamos essas alterações neste site. Este documento foi atualizado pela última vez no dia 21/02/2025.
        </Typography>
        <Typography className={classes.text}>
        2.9. AUTORIDADES DE APLICAÇÃO E CONTROLE
        </Typography>
        <Typography className={classes.text}>
          2.9.1 Se você deseja fazer uma reclamação ou acredita que por parte do DIALOGIX não respondemos adequadamente às suas preocupações relacionadas aos seus dados, você pode entrar em contato com a autoridade de controle correspondente ao seu local de residência.
        </Typography>
      </Box>

      <Box className={classes.section}>
      <Typography variant="h6">
        <Box sx={{ textTransform: 'uppercase', fontWeight:'bold'}}> 
          3. POLÍTICA DE COOKIES
        </Box>
        </Typography>
        <Typography className={classes.text}>
          3.1 O Dialogix usa cookies e tecnologias semelhantes para registrar dados de log. Usamos cookies baseados em sessão e persistentes.
        </Typography>
        <Typography className={classes.text}>
          3.1.1 Cookies são pequenos arquivos de texto enviados por nós para o seu computador e do seu computador ou dispositivo móvel para nós sempre que você visita nosso site ou usa nosso aplicativo de desktop. Eles são exclusivos da sua conta ou do seu navegador. Os cookies baseados em sessão duram apenas enquanto o navegador está aberto e são excluídos automaticamente quando você fecha o navegador. Os cookies persistentes duram até que você ou seu navegador os excluam ou até que expirem.
        </Typography>
        <Typography className={classes.text}>
          3.1.2 Alguns cookies estão associados à sua conta e Dados Pessoais para lembrar que você está conectado e em quais partes do Serviço ou Site você está conectado. Outros cookies não estão vinculados à sua conta, mas são únicos e nos permitem realizar análises e personalização do site, entre outras coisas semelhantes. Se você acessar os Serviços por meio de seu navegador, poderá gerenciar suas configurações de cookies, mas se desativar alguns ou todos os cookies, talvez não consiga usar os Serviços.
        </Typography>
        <Typography className={classes.text}>
          3.1.3 O DIALOGIX define e acessa nossos próprios cookies nos domínios operados pela DIALOGIX e seus afiliados. Além disso, usamos terceiros como o Google Analytics para análise de sites. Você pode desativar cookies de terceiros do Google Analytics em seu site.
        </Typography>
        <Typography className={classes.text}>
          3.2 COMO ALTERO MINHA CONFIGURAÇÃO DE COOKIES?
        </Typography>
        <Typography className={classes.text}>
          3.2.1 A maioria dos navegadores de internet permite algum tipo de controle dos cookies por meio de sua configuração.
        </Typography>
      </Box>

      <Box className={classes.section}>
        <Typography className={classes.text}>
          Para mais informações, entre em contato conosco.
        </Typography>
      </Box>
    </Container>
  );
};

export default PrivacyPolicy;
