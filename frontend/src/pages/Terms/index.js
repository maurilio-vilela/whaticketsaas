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

const Terms = () => {
  const classes = useStyles();

  return (
    <Container className={classes.container}>
      <Typography className={classes.title} variant="h4"  fontWeight="bold">
        Termos de Uso
      </Typography>

      <Box className={classes.section}>
        <Typography className={classes.text}>
        Este documento define quais são as condições e políticas que definem a relação você (cliente) e o DIALOGIX.
        </Typography>
      </Box>

      <Box className={classes.section}>
        <Typography variant="h6">
        <Box sx={{ textTransform: 'uppercase', fontWeight:'bold'}}> 
            Cláusula 1ª – Serviços prestados e documentos contratuais aplicáveis:
        </Box>
        </Typography>
        <Typography className={classes.text}>
            1.1 O dialogix é um Software como Serviço (Software as a Service - SaaS) para empresas (Business to Business – B2B) e pessoas (Business to Person – B2P) que facilita a gestão de relacionamento com clientes, através da centralização e distribuição de contato e atendimento de clientes, com cobertura multicanal de comunicação;
        </Typography>
        <Typography className={classes.text}>
            1.1.1 O principal canal de comunicação sobre o qual trabalha a solução DIALOGIX é o WhatsApp;
        </Typography>
        <Typography className={classes.text}>
            1.1.2 A solução DIALOGIX também trabalha com os canais de comunicação do grupo Meta, envolvendo Facebook e Instagram;
        </Typography>
        <Typography className={classes.text}>
            1.1.3 O CLIENTE poderá utilizar um número próprio pré-existente para utilização da comunicação via WhatsApp;
        </Typography>
        <Typography className={classes.text}>
            1.1.4 O CLIENTE poderá utilizar uma conta empresarial própria pré-existente para utilização da comunicação via Meta (Facebook e Instagram);
        </Typography>
        <Typography className={classes.text}>
            1.2 Além destes Termos de Uso e dos Termos de Uso do próprio WhatsApp, do Facebook e do Instagram (Meta), outros documentos poderão se aplicar sobre a prestação de seus serviços, conforme ajustes particulares formais que eventualmente existam entre nós. Neste caso, todos estes documentos compõem e formam seu Contrato;
        </Typography>
        <Typography className={classes.text}>
            1.3 As previsões contidas em documentos particulares eventualmente existentes entre nós prevalecerão quando tratarem de maneira diversa algum conteúdo destes Termos. Esta prevalência ocorrerá exclusivamente sobre este conteúdo especificamente considerado;
        </Typography>        
      </Box>

      <Box className={classes.section}>
        <Typography variant="h6">
        <Box sx={{ textTransform: 'uppercase', fontWeight:'bold'}}> 
            Cláusula 2ª – Partes do Contrato
        </Box>
        </Typography>
        <Typography className={classes.text}>
            2.1 As partes deste contrato são:
        </Typography>
        <Typography className={classes.text}>
            2.1.1 DIALOGIX: que compreende a empresa americana registrada sob o CNPJ n° 20.164.388/0001-73 com endereço a Rua Niterói, 52, Chácara Brasil, São Luís, Maranhão, Brasil;
        </Typography>
        <Typography className={classes.text}>
            2.1.2 “Você” ou “CLIENTE”: sociedade empresária ou pessoa física que contrata o licenciamento da solução DIALOGIX, tornando-se, portanto, responsável legal e financeira perante a DIALOGIX;
        </Typography>
      </Box>

      <Box className={classes.section}>
      <Typography variant="h6">
        <Box sx={{ textTransform: 'uppercase', fontWeight:'bold'}}> 
            Cláusula 3ª – Preços e condições comerciais
        </Box>
        </Typography>
        <Typography className={classes.text}>
            3.1 Salvo estipulação em sentido diverso formalizada em documento próprio entre as partes, os preços aplicáveis, assim como as features presentes em cada plano de contratação disponível, são aqueles expostos no link https://www.dialogix.com.br/#planos;
        </Typography>
        <Typography className={classes.text}>
            3.1.1 Os preços exibidos não incluem eventuais impostos ou retenções, os quais ficam à cargo exclusivo do CLIENTE;
        </Typography>
        <Typography className={classes.text}>
            3.1.2 Quando o CLIENTE contratar o DIALOGIX a partir de um país em que a DIALOGIX não tenha operação local, os serviços serão prestados e faturados a partir de sua operação no Brasil, conforme o caso;
        </Typography>
        <Typography className={classes.text}>
            3.2 A escolha do plano é realizada por você no momento da contratação dentro da própria plataforma através do botão “assinaturas” localizado no seu menu esquerdo;
        </Typography>
        <Typography className={classes.text}>
            3.2.1 Alterações de plano devem ser solicitadas igualmente por dentro da própria plataforma através do botão “assinaturas” localizado no seu menu esquerdo;
        </Typography>
        <Typography className={classes.text}>
            3.3 Os planos de contratação por assinatura compreendem um custo fixo mensal ou anual, determinado com base no número conexões (números de WhatsApp) e usuários da solução DIALOGIX contratados;
        </Typography>
        <Typography className={classes.text}>
            3.4 Eventual compra de créditos para a funcionalidade de campanha de mensagens será feita de forma totalmente independente e adicional e poderá ser igualmente realizada por dentro da própria plataforma através do botão “assinaturas” localizado no seu menu esquerdo
        </Typography>
      </Box>

      <Box className={classes.section}>
      <Typography variant="h6">
        <Box sx={{ textTransform: 'uppercase', fontWeight:'bold'}}> 
            Cláusula 4ª – Formas de Pagamento
        </Box>
        </Typography>
        <Typography className={classes.text}>
            4.1 As formas de pagamento aceitas são: PIX, Boleto Bancário, Débito Automático por Cartão de Crédito ou Cartão de Débito.
        </Typography>
        <Typography className={classes.text}>
            4.2 Dependendo da sua nacionalidade, considerando que DIALOGIX é uma empresa sediada no Brasil, poderá ser necessário que o cartão seja internacional.
        </Typography>
        <Typography className={classes.text}>
            4.3 As cobranças serão realizadas mensalmente e de forma antecipada, sendo o primeiro pagamento realizado no ato da contratação;
        </Typography>
        <Typography className={classes.text}>
            4.4 DIALOGIX não armazena nenhuma informação de cartão de crédito, sendo mantidos apenas os quatro últimos dígitos do cartão e um token de identificação dos meios de pagamento fornecidos pelo gateway de pagamentos;
        </Typography>
        <Typography className={classes.text}>
            4.5 DIALOGIX poderá suspender e bloquear o acesso do CLIENTE à solução e até mesmo rescindir motivadamente este contrato, caso o CLIENTE promova indevidamente (1) pedidos de estorno ou (2) contestações junto à operadora do cartão de crédito da cobrança prevista nesta cláusula;
        </Typography>
        <Typography className={classes.text}>
            4.6 Atrasos no pagamento autorizarão o DIALOGIX a suspender total ou parcialmente os serviços prestados, incluindo a funcionalidade de envio e recepção de mensagens via WhatsApp, Facebook, Instagram ou envio de campanhas.
        </Typography>
        <Typography className={classes.text}>
            4.7 Dependendo do caso, além da suspensão dos serviços prevista nas cláusulas anteriores, aos valores devidos serão acrescidos juros moratórios de 1% ao mês e multa não compensatória de 10%.
        </Typography>
      </Box>

      <Box className={classes.section}>
      <Typography variant="h6">
        <Box sx={{ textTransform: 'uppercase', fontWeight:'bold'}}> 
            Cláusula 5ª – Requisitos de uso da solução DIALOGIX:
        </Box>
        </Typography>
        <Typography className={classes.text}>
            5.1 São requisitos para a prestação dos serviços pelo DIALOGIX:
        </Typography>
        <Typography className={classes.text}>
            5.1.1 Navegador web atualizado compatível para acesso;
        </Typography>
        <Typography className={classes.text}>
            5.1.2 Aparelho celular móvel compatível;
        </Typography>
        <Typography className={classes.text}>
            5.1.3 O aceite e submissão às condições previstas nestes Termos;
        </Typography>
        <Typography className={classes.text}>
            5.1.4 A realização do pagamento de acordo com plano contratado;
        </Typography>
        <Typography className={classes.text}>
            5.1.5 O cadastramento dos dados do CLIENTE e de seus usuários autorizados na plataforma DIALOGIX;
        </Typography>
        <Typography className={classes.text}>
            5.1.6 A manutenção dos dados cadastrados de forma atualizada;
        </Typography>
        <Typography className={classes.text}>
            5.1.7 A configuração dos serviços pelo CLIENTE de acordo com suas necessidades;
        </Typography>
      </Box>

      <Box className={classes.section}>
      <Typography variant="h6">
        <Box sx={{ textTransform: 'uppercase', fontWeight:'bold'}}> 
            Cláusula 6ª – Declarações das Partes
        </Box>
        </Typography>
        <Typography className={classes.text}>
            6.1 DIALOGIX e você, que concordou com aplicação e conteúdo destes Termos, declaram que:
        </Typography>
        <Typography className={classes.text}>
            6.1.1 São legalmente capazes e legitimados para contratar, estão devidamente credenciadas a exercer suas atividades e se encontram em situação regular, possuindo todas as licenças, autorizações, certificados, permissões ou quaisquer outros requisitos eventualmente necessários em âmbito Federal, Estadual e Municipal;
        </Typography>
        <Typography className={classes.text}>
            6.1.2 Cumprem integralmente com suas obrigações legis, especialmente as de natureza fiscal, trabalhista e previdenciária;
        </Typography>
        <Typography className={classes.text}>
            6.1.3 Possuem os respectivos e necessários requisitos técnicos e operacionais para garantir a prestação e fruição dos serviços oferecidos pelo DIALOGIX;
        </Typography>
        <Typography className={classes.text}>
            6.1.4 Não existe qualquer obstáculo administrativo, judicial ou contratual que os impeça de cumprir com as obrigações assumidas no âmbito de seu Contrato;
        </Typography>
        <Typography className={classes.text}>
            6.1.5 Pautarão sua conduta, durante e posteriormente à vigência de seu Contrato, em boa-fé e transparência, de modo a não prejudicar direitos e expectativas legítimas uma da outra e respeitarão a função social de seu Contrato;
        </Typography>
        <Typography className={classes.text}>
            6.1.6 Para que se estabelecesse a relação contratual havida entre si, não foram necessários investimentos consideráveis ou de grande monta;
        </Typography>
        <Typography className={classes.text}>
            6.1.7 Se comprometem a cumprir toda a legislação aplicável;
        </Typography>
      </Box>

      <Box className={classes.section}>
      <Typography variant="h6">
        <Box sx={{ textTransform: 'uppercase', fontWeight:'bold'}}> 
            Cláusula 7ª – Previsões Gerais
        </Box>
        </Typography>
        <Typography className={classes.text}>
            7.1 Se qualquer das Partes não fizer valer – quando lhe for facultativo – qualquer das disposições que regem a relação havida entre si ou qualquer direito que possua, tal fato não deverá ser interpretado como uma renúncia nem como nova estipulação contratual;
        </Typography>
        <Typography className={classes.text}>
            7.1.1 Se, por qualquer motivo, alguma disposição contratual que rege o Contrato havido entre as Partes for considerada inválida, ilegal ou inexequível, as demais – no que não for impossível ou ilógico – permanecerão inalteradas e plenamente eficazes. Se necessário, as disposições afetadas poderão vir a ser substituídas por novas, cujos efeitos se aproximem ao máximo daquele desejado pelas Partes quando aceitas e acordadas aquelas disposições;
        </Typography>
        <Typography className={classes.text}>
            7.1.1 A constituição da relação havida entre as Partes não importará em exclusividade, permanecendo as Partes livres para contratar com outros fornecedores ou clientes;
        </Typography>
        <Typography className={classes.text}>
            7.1.2 Ambas as Partes deverão envidar todos os esforços possíveis para obrigar eventuais sucessores a cumprir com as obrigações assumidas contratualmente;
        </Typography>
        <Typography className={classes.text}>
            7.1.3 Sem limitação das obrigações e garantias estipuladas nestes Termos, os serviços contratados serão prestados pelo DIALOGIX “como estão” (“as is”), sem quaisquer garantias e obrigações, nos limites legais aplicáveis, de aperfeiçoamentos ou adequação a uma finalidade específica;
        </Typography>
        <Typography className={classes.text}>
            7.1.4 A relação havida entre DIALOGIX e CLIENTE é de prestador de serviços e tomador de serviços, respectivamente, de modo que não será considerada, em nenhuma hipótese, como um meio para constituir uma sociedade, joint venture, associação, mandato, representação, agência, consórcio ou, ainda, configurar uma relação trabalhista sob qualquer formato;
        </Typography>
      </Box>

      <Box className={classes.section}>
      <Typography variant="h6">
        <Box sx={{ textTransform: 'uppercase', fontWeight:'bold'}}> 
        Cláusula 8ª – Atualização de documentos contratuais
        </Box>
        </Typography>
        <Typography className={classes.text}>
            8.1 O CLIENTE reconhece e concorda que eventuais alterações nestes ou outros Termos que disciplinam a relação havida entre as Partes poderão ser realizadas unilateralmente pelo DIALOGIX a fim de comportar alterações ou evoluções sobre os serviços e/ou canais de comunicação sobre os quais trabalha a solução da DIALOGIX;
        </Typography>        
      </Box>

      <Box className={classes.section}>
      <Typography variant="h6">
        <Box sx={{ textTransform: 'uppercase', fontWeight:'bold'}}> 
            Cláusula 9ª – Propriedade Intelectual
        </Box>
        </Typography>
        <Typography className={classes.text}>
            9.1 As Partes se comprometem a respeitar recíproca e permanentemente os direitos autorais, marcas, patentes, registros, códigos fonte, softwares, desenhos industriais e demais direitos de propriedade intelectual;
        </Typography>
        <Typography className={classes.text}>
            9.2 Dada a natureza da atividade exercida pela DIALOGIX, de licenciamento de uso de software em formato as a service de solução de comunicação sobre canais de comunicação digital, qualquer tipo de desenvolvimento realizado sobre sua plataforma será considerado como de sua propriedade, cabendo ao CLIENTE, conforme o caso, a licença para uso deste eventual desenvolvimento somente enquanto contratado;
        </Typography>
        <Typography className={classes.text}>
            9.3 As Partes se comprometem a não reproduzir, decompilar ou aplicar engenharia reversa sobre quaisquer serviços ou plataformas umas das outras;
        </Typography>
        <Typography className={classes.text}>
            9.4 A utilização do nome, logomarca ou outros sinais distintivos de uma parte pela outra só poderá ocorrer mediante autorização neste sentido, salvo se disposto de forma contrária em qualquer outro documento assinado entre nós, obrigando-se ambas as partes, em qualquer caso, a nunca prejudicar ou violar direitos da outra ao fazê-lo.
        </Typography>        
      </Box>

      <Box className={classes.section}>
      <Typography variant="h6">
        <Box sx={{ textTransform: 'uppercase', fontWeight:'bold'}}> 
        Cláusula 10 – Sigilo e Confidencialidade
        </Box>
        </Typography>
        <Typography className={classes.text}>
            10.1 Dadas a natureza da relação havida entre as Partes e a natureza dos serviços prestados pela DIALOGIX, as Partes reconhecem que poderão ser trocadas entre si informações consideradas confidenciais;
        </Typography>
        <Typography className={classes.text}>
            10.2 Serão consideradas confidenciais as informações que não: (1) estiverem disponíveis ao público, (2) forem disponibilizadas ao público pelo proprietário da informação, (3) eram de conhecimento de alguma as Partes antes de ter acesso à determinada informação em virtude de seu Contrato, (4) tiverem sua divulgação determinada por ordem judicial ou autoridade administrativa no exercício de seus poderes ou (5) chegarem a conhecimento de qualquer das Partes com origem diversa da relação contratual mantida entre elas e sem violação de qualquer obrigação de sigilo que seja de conhecimento daquela receber a informação;
        </Typography>
        <Typography className={classes.text}>
            10.3 Na hipótese de determinação judicial ou administrativa de revelação de informação confidencial, caberá à Parte que tiver de cumprir a ordem o dever de informar o proprietário da informação – quando este ato de informar não for legalmente vedado pela ordem de revelação – o que deverá fazer antes de revelar a informação ou, quando isso não puder acontecer por qualquer circunstância, assim que possível;
        </Typography>
        <Typography className={classes.text}>
            10.4 As informações confidenciais fornecidas por qualquer das Partes para a execução de seu Contrato deverão ser utilizadas exclusivamente para as finalidades e no limite da necessidade pelas quais foram divulgadas. Em observância destas diretrizes, as Partes consentem com a revelação das informações confidenciais a empregados, prepostos ou representantes, os quais deverão estar submetidos a igual ou mais rigoroso dever de sigilo;
        </Typography>
        <Typography className={classes.text}>
            10.5 Os deveres de sigilo e confidencialidade previstos nestes Termos permanecerão vigentes por até 5 (cinco) anos após o fim da relação contratual havida entre as Partes;
        </Typography>        
      </Box>

      <Box className={classes.section}>
      <Typography variant="h6">
        <Box sx={{ textTransform: 'uppercase', fontWeight:'bold'}}> 
            Cláusula 11 – Subcontratação
        </Box>
        </Typography>
        <Typography className={classes.text}>
            11.1 O DIALOGIX poderá subcontratar empresas parceiras para a execução de parcela dos serviços contratados pelo CLIENTE;
        </Typography>       
      </Box>

      <Box className={classes.section}>
      <Typography variant="h6">
        <Box sx={{ textTransform: 'uppercase', fontWeight:'bold'}}> 
            Cláusula 12 – Ética e Práticas Anticorrupção
        </Box>
        </Typography>
        <Typography className={classes.text}>
            12.1 As Partes se comprometem a cumprir rigorosamente com a legislação brasileira anticorrupção atualizada, além de observar os mais altos padrões de boas práticas em nossos respectivos mercados e em termos de comunicação;
        </Typography>
        <Typography className={classes.text}>
            12.2 As Partes se comprometem a evitar que sejam dados ou recebidos quaisquer valores, presentes ou vantagens que não sejam consequência contratual das obrigações assumidas entre si;
        </Typography>
        <Typography className={classes.text}>
            12.3 As Partes declaram não estarem envolvidas e se comprometem a não se envolver, direta ou indiretamente, por si ou por seus representantes, em qualquer atividade ou prática que constitua uma infração de qualquer legislação anticorrupção;
        </Typography>
        <Typography className={classes.text}>
            12.4 As Partes se comprometem a (1) não se utilizar de trabalho infantil, escravo ou análogo e a (2) observar e cumprir com as disposições legais aplicáveis que digam respeito à proteção do meio ambiente;
        </Typography>
        <Typography className={classes.text}>
            12.5 Os deveres e declarações assumidas pelas Partes poderão ser objeto de auditoria pessoal ou por terceiros especificamente contratados, oportunidade em que serão perquiridos a analisados os documentos e atividades que comprovem a conformidade da Parte com os termos desta cláusula;
        </Typography>
      </Box>

      <Box className={classes.section}>
      <Typography variant="h6">
        <Box sx={{ textTransform: 'uppercase', fontWeight:'bold'}}> 
            Cláusula 13 – Caso Fortuito e Força Maior
        </Box>
        </Typography>
        <Typography className={classes.text}>
            13.1 Na hipótese de ocorrerem eventos que possam ser classificados como caso fortuito ou de força maior, a Parte que tomar conhecimento do evento deverá informar a outra em até 3 (três) dias a ocorrência do fato juntamente das medidas que estão sendo tomadas para combater o fato e a previsão de regularização, quando possível;
        </Typography>
        <Typography className={classes.text}>
            13.2 Os prazos eventualmente afetados por eventos de caso fortuito ou força maior serão prorrogados proporcionalmente ao atraso;
        </Typography>
        <Typography className={classes.text}>
            13.3 A interrupção dos serviços prestados pela DIALOGIX por período superior a 15 (quinze) dias durante eventos de caso fortuito ou força maior facultará a qualquer das Partes o encerramento do Contrato sem que sejam devidos quaisquer valores a título de multa ou indenização. Neste caso, ainda serão devidos os valores apurados em virtude da utilização e/ou disponibilização, conforme o caso, dos serviços prestados;
        </Typography>
        <Typography className={classes.text}>
            13.4 Caso Fortuito ou Força Maior não serão considerados excludentes do dever de contraprestação financeira assumida pelo CLIENTE em troca da prestação de serviços pela DIALOGIX;
        </Typography>
      </Box>

      <Box className={classes.section}>
      <Typography variant="h6">
        <Box sx={{ textTransform: 'uppercase', fontWeight:'bold'}}> 
            Cláusula 14 – Hipóteses de Encerramento do Contrato
        </Box>
        </Typography>
        <Typography className={classes.text}>
            14.1 Sem prejuízo de qualquer outro direito ou recurso que o DIALOGIX possa ter contra o Cliente, o DIALOGIX pode rescindir o contrato a qualquer momento e sem intervenção legal em caso de circunstâncias excepcionais que impossibilitem a continuidade de qualquer cooperação profissional entre a DIALOGIX e o Cliente.
        </Typography>
        <Typography className={classes.text}>
            14.1.1 O Cliente concorda que as seguintes circunstâncias devem ser consideradas como circunstâncias excepcionais:
        </Typography>
        <Typography className={classes.text}>
            14.1.1.1 Se o DIALOGIX detectar ou tiver motivos substanciais para supor que: Os Dados do Cliente são falsos, enganosos, imprecisos ou obsoletos;
        </Typography>
        <Typography className={classes.text}>
            14.1.1.2 O Cliente violar materialmente qualquer uma das disposições destes termos de serviço e, sem prejuízo de uma notificação do DIALOGIX (i) para regularizar a situação, bem como (ii) abster-se de tal violação e, se possível, (iii) impedir tal violação ou violações ocorram no futuro, não cumprir tal solicitação no prazo de 7 dias corridos após o recebimento de tal notificação, sem prejuízo da DIALOGIX de reivindicar do Cliente uma compensação adicional como resultado dessa violação contratual;
        </Typography>
        <Typography className={classes.text}>
            14.1.1.3 O Cliente usa a Ferramenta, Aplicativo e Serviços para fins não autorizados, ilegais e/ou inadequados;
        </Typography>
        <Typography className={classes.text}>
            14.1.1.4 O acordo com o Cliente é baseado em informações incorretas ou falsas do Cliente;
        </Typography>
        <Typography className={classes.text}>
            14.1.1.5 O Cliente solicitou os Serviços por motivos que não podem ser considerados objetivamente razoáveis e aceitáveis.
        </Typography>
        <Typography className={classes.text}>
            14.1.1.6 Se o Cliente cessar os seus pagamentos, declarar falência, for declarado falido, entrar em liquidação ou processo similar ou for liquidado;
        </Typography>
        <Typography className={classes.text}>
            14.1.1.7 Se o Cliente cometer um ato de desonestidade, deslealdade ou fraude em relação ao DIALOGIX, seus negócios ou a Ferramenta, Aplicativo e Serviços;
        </Typography>
        <Typography className={classes.text}>
            14.1.2 Em caso de rescisão pelo DIALOGIX, notificada por e-mail ou qualquer outro meio de comunicação, o contrato será automaticamente rescindido sem aviso prévio ou indenização e sem prejuízo do direito de indenização;
        </Typography>
        <Typography className={classes.text}>
            14.1.3 DIALOGIX não garante (i) sua capacidade de usar o Serviço, (ii) sua satisfação com o Serviço, (iii) que o Serviço estará disponível o tempo todo, ininterruptamente e sem erros (iv), a precisão dos cálculos matemáticos realizados pelo Serviço, e (v) que bugs ou erros no Serviço serão corrigidos.
        </Typography>
        <Typography className={classes.text}>
            14.1.24 DIALOGIX não é responsável por quaisquer danos diretos, indiretos, incidentais, consequentes, especiais, exemplares, punitivos ou outros danos decorrentes ou relacionados de alguma forma ao seu uso do Serviço. Seu único remédio para insatisfação com o Serviço é parar de usar o Serviço.
        </Typography>
        <Typography className={classes.text}>
            14.2 O Cliente poderá cancelar sua assinatura de forma imediata e resilir este contrato diretamente por dentro da plataforma, acessando o menu de “assinaturas” e selecionando a opção de cancelar sua assinatura;
        </Typography>
        <Typography className={classes.text}>
            14.2.1 A rescisão resultará na desativação ou exclusão de sua Conta ou seu acesso à sua Conta, e na perda e renúncia de todo o Conteúdo em sua Conta. Essas informações não podem ser recuperadas do DIALOGIX depois que sua conta for encerrada. Por favor, esteja ciente disso.
        </Typography>
        <Typography className={classes.text}>
            14.2.2 Nenhum reembolso ou crédito para Taxas será fornecido se você optar por rescindir este Contrato antes do final de sua Vigência. Se você rescindir este Contrato antes do término de sua Vigência, ou a DIALOGIX efetuar tal rescisão, além de outros valores que você possa dever à DIALOGIX, você deverá pagar imediatamente quaisquer Taxas não pagas associadas ao restante de sua Vigência.
        </Typography>
        <Typography className={classes.text}>
            14.3 Além de outras hipóteses previstas neste ou em outros documentos aplicáveis, o Contrato havido entre as Partes poderá ser considerado encerrado quando:
        </Typography>
        <Typography className={classes.text}>
            14.4 Os serviços oferecidos pelo DIALOGIX não mais puderem ser prestados por atos ou fatos imputáveis a qualquer das Partes ou a terceiros;
        </Typography>
        <Typography className={classes.text}>
            14.5 O CLIENTE permanecer inadimplente por período superior a 7 (sete) dias;
        </Typography>
      </Box>

      <Box className={classes.section}>
      <Typography variant="h6">
        <Box sx={{ textTransform: 'uppercase', fontWeight:'bold'}}> 
            Cláusula 15 – Serviços Beta e Serviços gratuitos
        </Box>
        </Typography>
        <Typography className={classes.text}>
            15.1 DIALOGIX ocasionalmente poderá disponibilizar serviços em fase Beta. A classificação de um serviço como “Beta”.
        </Typography>
        <Typography className={classes.text}>
            15.1.1 Os serviços em fase Beta são aqueles que não estão 100% (cem por cento) finalizados e que estão em constante evolução, mas que apresentam melhorias ou novas funcionalidades já aptas a serem utilizados de maneira funcional e eficaz;
        </Typography>
        <Typography className={classes.text}>
            15.2 Produtos Betas poderão ser fornecidos de forma gratuita ou mediante pagamento, o que não retirará suas características próprias de Beta;
        </Typography>
        <Typography className={classes.text}>
            15.3 Serviços em fase Beta poderão não apresentar perfeito funcionamento, pelo que condições como disponibilidade, eficiência e outras encontradas em serviços regulares podem não se aplicar;
        </Typography>
        <Typography className={classes.text}>
            15.4 A utilização de serviços em fase Beta pelo CLIENTE é voluntária e sob conhecimento das disposições previstas nesta cláusula, pelo que o DIALOGIX não poderá ser responsabilizada por atos ou fatos danosos ligados diretamente à utilização do serviço em fase Beta;
        </Typography>
        <Typography className={classes.text}>
            15.5 Serviços em fase Beta poderão apresentar Termos de Uso próprios que tratarão com detalhes as especificidades das condições e obrigações inerentes a tais serviços;
        </Typography>
        <Typography className={classes.text}>
            15.6 DIALOGIX não garante a continuidade do serviço e nem o lançamento de sua versão comercial;
        </Typography>
        <Typography className={classes.text}>
            15.7 DIALOGIX poderá descontinuar serviços em fase Beta a qualquer momento e independentemente de aviso prévio;
        </Typography>
        <Typography className={classes.text}>
            15.8 Além de serviços em fase Beta, o DIALOGIX também poderá colocar à disposição do CLIENTE free trials, serviços ou funcionalidades gratuitas através de suas Plataformas;
        </Typography>
        <Typography className={classes.text}>
            15.9 Serviços gratuitos poderão vir a ser descontinuados ou passar a ser cobrados em momento futuro. O CLIENTE será informado previamente, com pelo menos 30 (trinta) dias de antecedência, das condições comerciais propostas para utilização dos serviços.
        </Typography>
      </Box>

      <Box className={classes.section}>
      <Typography variant="h6">
        <Box sx={{ textTransform: 'uppercase', fontWeight:'bold'}}> 
            Cláusula 16 – Conteúdo Trafegado
        </Box>
        </Typography>
        <Typography className={classes.text}>
            16.1 Cabe exclusivamente ao CLIENTE a escolha e/ou elaboração do conteúdo a ser enviado nas mensagens trafegadas através dos serviços prestados pelo DIALOGIX;
        </Typography>
        <Typography className={classes.text}>
            16.2 Ao se comunicar, porém, o CLIENTE deverá:
        </Typography>
        <Typography className={classes.text}>
            16.2.1 Sempre se identificar de forma, clara, precisa e legítima ao iniciar sua comunicação;
        </Typography>
        <Typography className={classes.text}>
            16.2.2 Não trafegar conteúdo dúbio, cuja natureza não possa ser claramente identificada;
        </Typography>
        <Typography className={classes.text}>
            16.2.3 Não trafegar mensagens cujo conteúdo seja reconhecidamente falso ou propositalmente desatualizado;
        </Typography>
        <Typography className={classes.text}>
            16.2.4 Respeitar a função social da comunicação;
        </Typography>
        <Typography className={classes.text}>
            16.2.5 Não violar direitos de terceiros;
        </Typography>
        <Typography className={classes.text}>
            16.2.6 Respeitar os direitos de titulares de dados pessoais tratados pela comunicação realizada;
        </Typography>
        <Typography className={classes.text}>
            16.2.7 observar e seguir a legislação vigente e aplicável, além das regras de uso do canal de comunicação utilizado, especialmente os Termos de Uso – WhatsApp, do Facebook e do Instragram (Meta);
        </Typography>
        <Typography className={classes.text}>
            16.3 Não importando a solução ou canal utilizado pelo CLIENTE, as mensagens trafegadas devem ter natureza estritamente comercial, corporativa e/ou institucional, sendo vedada a utilização dos serviços da DIALOGIX para tráfego de mensagens de natureza pessoal ou diversa;
        </Typography>
        <Typography className={classes.text}>
            16.4 Caso, em virtude do conteúdo trafegado pelo CLIENTE, o DIALOGIX venha sofrer (1) qualquer tipo de sanção, legal ou contratual, imposta por órgão governamental ou empresa controladora de canal de comunicação, ou venha a sofrer (2) qualquer tipo de dano reclamado por terceiro, o CLIENTE será cobrado do valor correspondente de forma integral e imediata, sem prejuízo de apuração de eventuais perdas e danos adicionais;
        </Typography>
      </Box>

      <Box className={classes.section}>
      <Typography variant="h6">
        <Box sx={{ textTransform: 'uppercase', fontWeight:'bold'}}> 
            Cláusula 17 – Política de precificação
        </Box>
        </Typography>
        <Typography className={classes.text}>
            17.1 O DIALOGIX poderá, mediante aviso prévio de pelo menos 30 (trinta) dias alterar os preços praticados sobre os serviços prestados de acordo com suas necessidades;
        </Typography>
        <Typography className={classes.text}>
            17.2 Caso o CLIENTE não concorde com os preços atualizados, poderá solicitar o cancelamento de seu contrato, sem qualquer ônus, diretamente por dentro da plataforma através do botão “assinaturas” no seu menu esquerdo;
        </Typography>
        <Typography className={classes.text}>
            17.3 A utilização dos serviços prestados pelo DIALOGIX importará em aceitação do CLIENTE sobre as novas condições comerciais;
        </Typography>
      </Box>

      <Box className={classes.section}>
      <Typography variant="h6">
        <Box sx={{ textTransform: 'uppercase', fontWeight:'bold'}}> 
            Cláusula 18 – Responsabilidades
        </Box>
        </Typography>
        <Typography className={classes.text}>
            18.1 O DIALOGIX não será responsável por:
        </Typography>
        <Typography className={classes.text}>
            18.1.1 Danos indiretos e/ou consequentes (incluindo, mas não limitado a, perda de renda, perda de fundo de comércio e danos à propriedade do Cliente causados pela Ferramenta, Aplicativo e Serviços). Esta limitação de responsabilidade também se aplica quando o DIALOGIX foi especificamente informada da perda potencial pelo Cliente;
        </Typography>
        <Typography className={classes.text}>
            18.1.2 Defeitos que tenham sido causados direta ou indiretamente por ato do Cliente ou de terceiro, independentemente de serem causados por erro ou negligência;
        </Typography>
        <Typography className={classes.text}>
            18.1.3 Danos causados pelo uso da Ferramenta, Aplicativo e Serviços para uma finalidade diferente da finalidade para a qual foi desenvolvida ou destinada pelo DIALOGIX;
        </Typography>
        <Typography className={classes.text}>
            18.1.4 Danos adicionais causados pelo uso continuado pelo Cliente, Administrador e/ou Usuários após a detecção de um defeito;
        </Typography>
        <Typography className={classes.text}>
            18.1.5 A perda ou uso incorreto dos Dados do Cliente, a menos que seja exclusivamente por sua culpa;
        </Typography>
        <Typography className={classes.text}>
            18.1.6 Danos causados pelo não cumprimento de qualquer conselho e/ou orientação que possa ser dada pela DIALOGIX, que esta sempre fornece de forma discricionária;
        </Typography>
        <Typography className={classes.text}>
            18.1.7 Danos causados por força maior.
        </Typography>
        <Typography className={classes.text}>
            18.1.8 Considera-se que o Cliente não fornece nenhuma informação (confidencial) (por exemplo, uma planilha do Excel com dados, incluindo Dados do Cliente) nem quaisquer dados de login a qualquer funcionário da DIALOGIX de qualquer maneira e por qualquer motivo. Se o Cliente, ao contrário do acima, fornecer qualquer um desses dados ao DIALOGIX, o Cliente reconhece que está agindo inteiramente por sua conta e risco. Nesse caso, o DIALOGIX não pode garantir a mesma segurança e confidencialidade em relação às informações fornecidas que garante em relação aos Dados do Cliente.
        </Typography>
        <Typography className={classes.text}>
            18.1.9 O Cliente deverá indenizar e/ou isentar o DIALOGIX contra todas as reclamações de qualquer natureza que possam surgir da existência, implementação, não conformidade e/ou rescisão destes termos de serviço e que tenham sido causadas por sua própria negligência, culpa ou descuido ou por seu Administrador e/ou qualquer de seus Usuários.
        </Typography>
        <Typography className={classes.text}>
            18.2 DIALOGIX não indenizará danos de qualquer natureza que sejam causados em virtude do conteúdo das mensagens trafegadas pelo CLIENTE;
        </Typography>
        <Typography className={classes.text}>
            18.3 DIALOGIX não indenizará lucros cessantes ou danos causados em virtude de perdas de chance ou hipóteses semelhantes;
        </Typography>
        <Typography className={classes.text}>
            18.4 DIALOGIX não indenizará danos causados em virtude da utilização de produtos em fase Beta;
        </Typography>
        <Typography className={classes.text}>
            18.5 DIALOGIX não responderá por atos, fatos ou falhas ligadas diretamente (1) aos fornecedores dos canais de comunicação, como o Facebook, Instagram (Meta), ou (2) à terceiros cuja atuação não está sob sua direção, supervisão ou responsabilidade;
        </Typography>
        <Typography className={classes.text}>
            18.6 Caso o DIALOGIX seja alvo de autuação por parte de qualquer autoridade governamental ou empresa terceira fornecedora, e essa autuação tenha origem em ato ou fato praticado (1) pelo CLIENTE, (2) por terceiro que se possa entender sob responsabilidade do CLIENTE ou (3) por terceiro em uso indevido e culpável das credenciais de acesso do CLIENTE à qualquer dos canais, plataformas ou ferramentas oferecidas pela DIALOGIX, o CLIENTE deverá assumir a responsabilidade por esta autuação e reembolsar o DIALOGIX de quaisquer despesas que esta tenha incorrido ou danos que tenha sofrido em virtude da autuação;
        </Typography>
        <Typography className={classes.text}>
            18.7 Salvo os casos previstos nas cláusulas acima ou em outras especificamente previstas nestes Termos, o DIALOGIX e o CLIENTE responderão nos limites da respectiva participação em cada evento danoso;
        </Typography>
        <Typography className={classes.text}>
            18.8 O CLIENTE deverá indenizar solidariamente danos causados em virtude da violação de quaisquer obrigações previstas neste ou em outros Termos aplicáveis quando tal violação for praticada, (1) terceiro que se possa entender sob responsabilidade do CLIENTE ou (3) por terceiro em uso indevido e culpável de suas credenciais de acesso a qualquer dos canais, plataformas ou ferramentas oferecidas pela DIALOGIX;
        </Typography>
        <Typography className={classes.text}>
            18.9 Diante de processos judiciais ou administrativos a Parte que for responsável pelos fatos lá apurados – de acordo com a lei ou quaisquer dos Termos aplicáveis – deverá (1) envidar todos os esforços que razoavelmente se espera para defender e manter indene a parte inocente e (2) assumir sua parcela de responsabilidade sobre os atos e fatos em discussão, buscando, quando for o caso, a exclusão da parte inocente daquele processo;
        </Typography>
      </Box>

      <Box className={classes.section}>
      <Typography variant="h6">
        <Box sx={{ textTransform: 'uppercase', fontWeight:'bold'}}> 
            Cláusula 19 – Segurança de Informação e Tratamento de Dados Pessoais
        </Box>
        </Typography>
        <Typography className={classes.text}>
            19.1 DIALOGIX e o CLIENTE se comprometem a tratar os Dados Pessoais envolvidos na confecção e necessários à execução do contrato firmado entre si, única e exclusivamente para cumprir com a finalidade a que se destinam e em respeito a toda a legislação aplicável de privacidade e proteção de Dados Pessoais, sob pena de incidência de multa por descumprimento contratual, sem prejuízo de perdas e danos
        </Typography>
        <Typography className={classes.text}>
            19.2 O DIALOGIX ou suas afiliadas, seus funcionários, representantes, contratados ou outros realizará o Tratamento de Dados Pessoais em nome do CONTROLADOR garantirá que qualquer pessoa envolvida no Tratamento de Dados Pessoais em seu nome, em razão do contrato firmado entre DIALOGIX e CLIENTE, cumprirá com as disposições previstas nesta cláusula;
        </Typography>
        <Typography className={classes.text}>
            19.2.1 Finalidade: O DIALOGIX, enquanto Operadora, irá tratar os Dados Pessoais recebidos apenas para cumprir o quanto disposto em contrato firmado com o CLIENTE, em eventuais aditivos ou para cumprir as instruções fornecidas pelo Controlador dentro da relação contratual, sempre em observância aos princípios e regras aplicáveis, observando-se a legislação de privacidade e proteção de dados aplicável;
        </Typography>
        <Typography className={classes.text}>
            19.2.2 Medidas e controles de segurança: DIALOGIX declara e garante possuir medidas implementadas para proteger os Dados Pessoais tratados, assim como possui uma política de segurança da informação instituída, a qual determina medidas técnicas e administrativas capazes de garantir a integridade, disponibilidade e confidencialidade das informações tratadas;
        </Typography>
        <Typography className={classes.text}>
            19.2.3 Compartilhamento de informações pessoais: DIALOGIX assegurará que os Dados Pessoais não sejam acessados, compartilhados ou transferidos para terceiros (incluindo subcontratados, agentes autorizados e afiliados) sem a autorização prévia e por escrito do Controlador, exceto nos casos necessários para a execução do contrato firmado com o CLIENTE;
        </Typography>
        <Typography className={classes.text}>
            19.2.4 Nos casos em que ocorrerem compartilhamentos para terceiros, o DIALOGIX deverá se certificar de que os terceiros: a) observem a legislação aplicável sobre privacidade e proteção de dados; b) observem as finalidades e diretrizes estabelecidas pelo Controlador para o Tratamento dos Dados Pessoais; e c) adotem, no mínimo, os mesmos padrões de proteção de dados adotados pela DIALOGIX;
        </Typography>
      </Box>
      
    </Container>
  );
};

export default Terms;
