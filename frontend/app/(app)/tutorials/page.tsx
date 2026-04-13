"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Rocket,
  Package,
  Users,
  FileText,
  GitBranch,
  Calendar,
  BarChart3,
  Sparkles,
  Search,
  ChevronDown,
  ChevronUp,
  BookOpen,
  CheckCircle2,
  DollarSign,
  TrendingDown,
  Zap,
  FileSignature,
  CheckCircle,
  Link,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Tutorial data                                                      */
/* ------------------------------------------------------------------ */

type Difficulty = "basico" | "intermediario";

interface Tutorial {
  id: number;
  category: string;
  title: string;
  difficulty: Difficulty;
  content: string;
}

const tutorials: Tutorial[] = [
  {
    id: 1,
    category: "Primeiros Passos",
    title: "Bem-vindo ao Île Magique",
    difficulty: "basico",
    content: `O Île Magique é um sistema completo de gestão para empresas de decoração de festas infantis. Com ele, você controla orçamentos, clientes, fornecedores, agenda e muito mais — tudo em um só lugar.

• Dashboard: seu painel de controle com resumo de tudo que está acontecendo
• Pipeline: funil de vendas para acompanhar seus leads do primeiro contato até o fechamento
• Orçamentos: crie, edite e envie propostas profissionais em PDF
• Agenda: calendário com todos os seus eventos e festas
• Catálogo: seus itens de decoração com custo e preço de venda
• Clientes: base de clientes com histórico completo
• Fornecedores: contatos dos seus fornecedores organizados por categoria

Dica: comece pelo Dashboard toda manhã — é a melhor forma de ver o que precisa de atenção hoje.`,
  },
  {
    id: 2,
    category: "Primeiros Passos",
    title: "Configurando sua Empresa",
    difficulty: "basico",
    content: `Antes de começar a usar o sistema, configure os dados da sua empresa para que os orçamentos saiam com sua identidade.

• Acesse Configurações no menu lateral
• Preencha o nome da empresa, telefone e Instagram
• Defina os parâmetros financeiros:
  - Taxa de impostos (%) — normalmente entre 6% e 15%
  - Margem de lucro desejada (%) — recomendamos mínimo de 30%
  - Média de festas por mês — quantas festas você faz em média
• Cadastre seus custos fixos mensais: aluguel do ateliê, seguro, internet, manutenção de equipamentos
• O sistema calcula automaticamente quanto de custo fixo entra em cada festa (rateio)

Dica: revise esses valores a cada 3 meses para manter seus preços atualizados e sua margem saudável.`,
  },
  {
    id: 3,
    category: "Catálogo e Pacotes",
    title: "Cadastrando seus Itens de Decoração",
    difficulty: "basico",
    content: `O catálogo é a base do seu sistema de precificação. Cada item que você usa nas festas deve estar cadastrado com o custo real e o preço de venda.

• Acesse Catálogo no menu lateral
• Clique em Novo Item para adicionar um item
• Preencha os campos:
  - Nome: nome descritivo do item (ex: Mesa decorada tema Safari)
  - Categoria: Decoração, Balões, Brindes, Tecidos ou Iluminação
  - Custo: quanto você gasta para ter/usar esse item
  - Preço de venda: quanto o cliente paga por ele
• O sistema calcula a margem automaticamente — verde (boa), amarelo (atenção), vermelho (prejuízo)
• Organize por categorias para encontrar rápido na hora do orçamento

Dica: mantenha o custo sempre atualizado. Quando o fornecedor aumenta o preço, atualize no catálogo para sua margem continuar real.`,
  },
  {
    id: 4,
    category: "Catálogo e Pacotes",
    title: "Criando Pacotes Pré-montados",
    difficulty: "basico",
    content: `Pacotes são conjuntos de itens do catálogo que você monta antecipadamente. Isso agiliza muito a criação de orçamentos.

• Acesse Pacotes no menu
• Clique em Novo Pacote
• Dê um nome claro (ex: Pacote Básico, Pacote Premium, Pacote Luxo)
• Selecione itens do catálogo e defina a quantidade de cada um
• O sistema soma o preço total do pacote automaticamente
• Na hora de fazer um orçamento, aplique o pacote com um clique e ajuste conforme o pedido do cliente

Dica: crie pelo menos 3 pacotes com faixas de preço diferentes (econômico, intermediário, premium). Isso facilita a apresentação ao cliente e aumenta as chances de fechar negócio.`,
  },
  {
    id: 5,
    category: "Catálogo e Pacotes",
    title: "Temas de Festa",
    difficulty: "basico",
    content: `Os temas ajudam a organizar e categorizar suas festas. Cada tema pode ter uma cor, emoji e descrição própria.

• Os temas ficam disponíveis nas Configurações
• Cada tema tem: nome (ex: Safari, Princesas), cor identificadora e emoji
• Quando você escolhe um tema no orçamento, ele fica vinculado automaticamente
• Os temas aparecem nos cards de lead e orçamento para identificação rápida

Dica: crie temas para os tipos de festa que você mais faz. Com o tempo, você terá uma biblioteca de temas que acelera todo o processo de orçamentação.`,
  },
  {
    id: 6,
    category: "Gestão de Clientes",
    title: "Cadastrando Clientes",
    difficulty: "basico",
    content: `Manter uma base de clientes organizada é fundamental para o crescimento do seu negócio.

• Acesse Clientes no menu lateral
• Clique em Novo Cliente
• Preencha os dados:
  - Nome completo
  - Telefone (preferencialmente WhatsApp)
  - E-mail
  - Cidade
• O histórico de orçamentos de cada cliente é mantido automaticamente
• Use a busca para encontrar clientes rapidamente

Dica: sempre cadastre o cliente antes de fazer o orçamento. Assim você constrói um relacionamento e pode entrar em contato para festas futuras (aniversário do irmão, próximo ano, etc).`,
  },
  {
    id: 7,
    category: "Gestão de Clientes",
    title: "Histórico e Reorçamento",
    difficulty: "intermediario",
    content: `O sistema mantém todo o histórico de orçamentos vinculado a cada cliente. Isso é muito útil para reorçamentos.

• Na lista de orçamentos, você pode ver todos os orçamentos por cliente
• Para reaproveitar um orçamento antigo (ex: a mesma mãe quer festa para outro filho):
  - Encontre o orçamento anterior
  - Clique no ícone de duplicar
  - O sistema cria uma cópia exata como rascunho
  - Ajuste os itens, valores e data — pronto!
• Isso economiza muito tempo e mantém a consistência do seu trabalho

Dica: clientes que voltam são os melhores clientes. Mantenha o relacionamento e ofereça condições especiais para quem já é cliente.`,
  },
  {
    id: 8,
    category: "Orçamentos",
    title: "Criando seu Primeiro Orçamento",
    difficulty: "basico",
    content: `O orçamento é o coração do sistema. Aqui você monta a proposta completa para o cliente.

• Clique em Novo Orçamento na sidebar ou no Dashboard
• Selecione o cliente (ou crie um novo)
• Escolha a data do evento e o tema da festa
• Adicione itens de 3 formas:
  - Do Catálogo: busque e adicione itens já cadastrados
  - De um Pacote: aplique um pacote inteiro com um clique
  - Personalizado: crie itens avulsos na hora
• Adicione despesas variáveis: transporte, ajudante, estacionamento
• O sistema calcula tudo em tempo real: custo, impostos, margem de lucro
• O indicador de lucro mostra se você está no verde ou no vermelho

Dica: preste atenção no indicador de margem. Se ficar abaixo de 20%, reveja os preços. Trabalhar com margem baixa não compensa o desgaste.`,
  },
  {
    id: 9,
    category: "Orçamentos",
    title: "Entendendo o Cálculo de Preços",
    difficulty: "intermediario",
    content: `Entender como o sistema calcula os preços é essencial para precificar corretamente.

O cálculo funciona assim:
• Subtotal = soma de (preço de venda × quantidade) de cada item
• Impostos = subtotal × sua taxa de imposto (definida em Configurações)
• Custos fixos por festa = total dos custos fixos mensais ÷ número de festas por mês
• Custo total = custo dos itens + despesas variáveis + custos fixos rateados
• Total cobrado do cliente = subtotal + impostos - desconto
• Lucro real = total cobrado - custo total - impostos
• Margem real = lucro ÷ total cobrado × 100

Exemplo prático: se seus custos fixos são R$ 1.400/mês e você faz 8 festas, cada festa absorve R$ 175 de custo fixo. Isso entra automaticamente no cálculo.

Dica: se a margem aparecer em vermelho, significa que você está cobrando menos do que gasta. Revise seus preços ou reduza custos!`,
  },
  {
    id: 10,
    category: "Orçamentos",
    title: "Status do Orçamento",
    difficulty: "basico",
    content: `Os status ajudam a controlar em que fase está cada orçamento.

Os 5 status são:
• Rascunho — você está montando o orçamento, ainda não enviou ao cliente
• Enviado — o cliente recebeu a proposta (via PDF, WhatsApp, etc)
• Aprovado — o cliente aceitou e confirmou a festa
• Pago — o pagamento foi recebido (parcial ou total)
• Realizado — a festa aconteceu e tudo foi entregue

Para mudar o status, clique nos botões no topo do editor de orçamento.

No Dashboard, você vê um resumo de quantos orçamentos estão em cada status, o que ajuda a entender seu funil de vendas.

Dica: mantenha os status atualizados. Isso melhora seus relatórios e te dá uma visão real do negócio.`,
  },
  {
    id: 11,
    category: "Orçamentos",
    title: "Gerando PDF do Orçamento",
    difficulty: "basico",
    content: `O PDF é a forma profissional de enviar o orçamento ao cliente.

• No editor do orçamento, clique no botão Gerar PDF
• O sistema gera um documento elegante com:
  - Logo e dados da sua empresa
  - Dados do cliente e do evento
  - Tabela detalhada de itens com quantidades e valores
  - Resumo financeiro: subtotal, impostos, desconto, total
  - Condições de pagamento
  - Validade do orçamento
• O PDF é baixado automaticamente no seu computador
• Envie por WhatsApp, e-mail ou imprima

Dica: personalize a cor do PDF em Configurações para combinar com a identidade visual da sua marca. Um orçamento bonito passa mais profissionalismo.`,
  },
  {
    id: 12,
    category: "Orçamentos",
    title: "Desconto e Condições de Pagamento",
    difficulty: "intermediario",
    content: `Saber dar desconto estrategicamente e definir boas condições de pagamento pode fechar mais negócios.

Desconto:
• No editor do orçamento, use o campo Desconto para dar desconto em reais
• O sistema recalcula tudo automaticamente: total, lucro e margem
• Sempre confira a margem depois de aplicar o desconto

Condições de pagamento:
• Defina as condições no campo específico, exemplos:
  - 50% na aprovação + 50% no dia do evento
  - 30% entrada + 3x sem juros no cartão
  - PIX com 5% de desconto à vista
• A condição aparece no PDF do orçamento

Validade:
• O padrão é 7 dias, mas você pode ajustar
• Orçamentos com validade curta criam senso de urgência
• Após vencer, o cliente pode pedir atualização de valores

Dica: nunca dê desconto sem olhar a margem. Um desconto de 10% pode transformar lucro em prejuízo se sua margem já for apertada.`,
  },
  {
    id: 13,
    category: "Funil de Vendas",
    title: "Criando seu Funil de Vendas",
    difficulty: "intermediario",
    content: `O funil de vendas (Pipeline) é onde você acompanha cada oportunidade desde o primeiro contato até o fechamento.

• Acesse Pipeline no menu lateral
• Clique em Novo Funil para criar um funil personalizado
• O sistema oferece criar com estágios padrão:
  - Novo Lead: primeiro contato recebido
  - Contato Feito: você já conversou com o cliente
  - Orçamento Enviado: proposta enviada
  - Negociação: cliente pediu ajustes ou está decidindo
  - Fechado: negócio fechado com sucesso
  - Perdido: cliente não fechou
• Personalize os nomes e cores dos estágios
• Você pode criar múltiplos funis para diferentes canais (Instagram, Indicação, WhatsApp)

Dica: o funil padrão funciona para a maioria dos casos. Só crie funis extras se realmente tiver processos diferentes por canal.`,
  },
  {
    id: 14,
    category: "Funil de Vendas",
    title: "Gerenciando Leads no Kanban",
    difficulty: "basico",
    content: `O Kanban é o quadro visual onde você gerencia seus leads dia a dia.

• Clique no + em qualquer coluna para adicionar um lead rápido
• Preencha: nome do contato, tipo de evento e valor estimado
• Arraste os cards entre colunas para acompanhar o progresso
• Clique no card para abrir os detalhes completos e editar
• Quando fechar a venda, clique em Converter em Orçamento
  - O sistema cria automaticamente um orçamento vinculado ao cliente
  - Se o lead não estava cadastrado como cliente, o sistema cadastra também

No card do lead você vê:
• Nome do contato
• Tipo de evento
• Data prevista
• Valor estimado (em verde)

Dica: revise seu funil toda segunda-feira. Leads parados há mais de uma semana precisam de um follow-up. Não deixe oportunidades esfriarem!`,
  },
  {
    id: 15,
    category: "Funil de Vendas",
    title: "Editando o Funil",
    difficulty: "intermediario",
    content: `Você pode personalizar completamente a estrutura do seu funil.

• Clique no ícone de engrenagem ao lado do nome do funil
• No painel de edição você pode:
  - Renomear o funil
  - Editar o nome de cada estágio
  - Mudar a cor de cada estágio (útil para identificação visual rápida)
  - Adicionar novos estágios
  - Remover estágios que não usa
  - Reordenar os estágios com as setas
• Após fazer as alterações, clique em Salvar
• Para excluir o funil inteiro, use o botão vermelho (cuidado: isso remove todos os leads do funil!)

Exemplos de funis personalizados:
• Funil Instagram: DM Recebida → Respondida → Orçamento → Fechado
• Funil Indicação: Indicação → Contato → Visita → Proposta → Fechado
• Funil Eventos Corporativos: Briefing → Proposta → Aprovação → Contrato → Execução

Dica: mantenha seus funis simples. Muitos estágios confundem mais do que ajudam. De 4 a 6 estágios é o ideal.`,
  },
  {
    id: 16,
    category: "Agenda e Operacional",
    title: "Usando a Agenda",
    difficulty: "basico",
    content: `A Agenda te ajuda a visualizar todos os seus compromissos e festas em um calendário mensal.

• Acesse Agenda no menu lateral
• Navegue entre os meses com as setas
• Dias com eventos marcados mostram bolinhas coloridas:
  - Verde: evento confirmado
  - Amarelo: tentativo (aguardando confirmação)
  - Vermelho: cancelado
• Clique em um dia para ver os detalhes dos eventos
• Use o botão Novo Evento para criar eventos manualmente

Cada evento tem:
• Título (nome da festa ou compromisso)
• Data e horário
• Endereço do local
• Status (confirmado, tentativo, cancelado)
• Vínculo com cliente e orçamento

Dica: antes de confirmar uma data com o cliente, sempre verifique a agenda para evitar conflitos. Duas festas no mesmo dia podem ser viáveis, mas exigem planejamento.`,
  },
  {
    id: 17,
    category: "Agenda e Operacional",
    title: "Checklist Operacional",
    difficulty: "intermediario",
    content: `O checklist é sua lista de tarefas para garantir que nada seja esquecido na preparação e execução de cada festa.

• No editor do orçamento, clique em Gerar Checklist
• O sistema cria automaticamente tarefas baseadas nos itens do orçamento:
  - Confirmar data do evento
  - Comprar/preparar cada item da decoração
  - Confirmar transporte
  - Montagem no local
  - Desmontagem e recolhimento
• Marque cada tarefa conforme for completando
• Adicione tarefas personalizadas conforme necessário

O checklist ajuda especialmente quando:
• Você tem várias festas na mesma semana
• Tem equipe e precisa delegar tarefas
• Quer garantir que nenhum detalhe escape

Dica: use o checklist como roteiro no dia da montagem. Vá marcando cada item conforme for instalando. Isso evita aquele momento de pânico de achar que esqueceu algo.`,
  },
  {
    id: 18,
    category: "Gestão e Financeiro",
    title: "Dashboard — Seu Painel de Controle",
    difficulty: "basico",
    content: `O Dashboard é a primeira coisa que você deve olhar ao abrir o sistema. Ele mostra um resumo completo do seu negócio.

O que você encontra no Dashboard:
• Faturamento total: soma de todos os orçamentos aprovados e pagos
• Total de orçamentos: quantas propostas você tem
• Ticket médio: valor médio dos seus orçamentos
• Total de clientes: sua base de clientes
• Gráfico de receita: visualize a evolução do faturamento ao longo dos meses
• Pipeline resumido: quantos leads em cada estágio do funil
• Próximos eventos: festas que estão chegando
• Leads recentes: últimos contatos adicionados

Dica: acesse o Dashboard todo dia de manhã como primeira atividade. Em 30 segundos você tem uma foto completa do seu negócio e sabe o que precisa de atenção.`,
  },
  {
    id: 19,
    category: "Gestão e Financeiro",
    title: "Fornecedores",
    difficulty: "basico",
    content: `Manter seus fornecedores organizados facilita muito quando você precisa fazer compras para uma festa.

• Acesse Fornecedores no menu lateral
• Cadastre cada fornecedor com: nome, telefone, e-mail e categoria
• As categorias ajudam a filtrar: Balões, Doces, Bolo, Flores, Tecidos, Iluminação, Móveis
• Use o filtro por categoria para encontrar rapidamente

Quando fechar uma festa, você sabe exatamente:
• Quem contatar para encomendar o bolo
• Qual fornecedor de balões tem o melhor preço
• Onde alugar os móveis

Dica: mantenha pelo menos 2 fornecedores por categoria. Se um não puder atender, você tem alternativa e não perde o prazo.`,
  },
  {
    id: 20,
    category: "Gestão e Financeiro",
    title: "Gerenciando Usuários",
    difficulty: "intermediario",
    content: `Se você tem equipe, pode criar contas individuais para cada pessoa.

• Acesse Usuários no menu (apenas administradores têm acesso)
• Clique em Novo Usuário
• Preencha: nome, e-mail, senha e tipo de acesso
• Tipos de acesso:
  - Admin: acesso total a todas as funcionalidades
  - Usuário: acesso limitado (ideal para assistentes e montadores)
• Você pode desativar contas temporariamente sem excluí-las

Cada pessoa da equipe deve ter seu próprio login. Isso garante:
• Rastreabilidade de quem fez o quê
• Segurança dos dados
• Personalização da experiência

Dica: quando alguém sair da equipe, desative a conta em vez de excluir. Assim o histórico de ações é preservado.`,
  },
  {
    id: 21,
    category: "Dicas Avançadas",
    title: "Comparativo de Cenários",
    difficulty: "intermediario",
    content: `A técnica de cenários é uma das ferramentas mais poderosas para aumentar seu ticket médio.

• No editor do orçamento, clique em Gerar Cenários
• O sistema cria automaticamente 3 versões:
  - Econômico: 70% dos valores (opção mais acessível)
  - Intermediário: 100% dos valores (sua proposta padrão)
  - Premium: 140% dos valores (opção completa/luxo)

Por que funciona:
• É uma técnica de ancoragem: o cliente vê o Premium (mais caro) primeiro
• O Intermediário parece mais razoável em comparação
• A maioria dos clientes escolhe o Intermediário ou Premium
• Sem os cenários, muitos pediriam desconto no preço único

Como apresentar:
• Envie os 3 PDFs ao cliente
• Explique brevemente cada opção
• Deixe o cliente escolher sem pressão

Dica: nomeie os cenários de forma atrativa: em vez de Econômico use Essencial, em vez de Premium use Sonho Encantado. O nome vende!`,
  },
  {
    id: 22,
    category: "Dicas Avançadas",
    title: "Duplicar Orçamentos",
    difficulty: "basico",
    content: `Duplicar orçamentos economiza muito tempo quando você precisa criar propostas similares.

Quando usar:
• Cliente quer festa parecida com outra que você já fez
• Mesma família quer festa para outro filho
• Você quer criar uma variação (com e sem determinado item)
• Precisa reorçar algo que mudou de preço

Como fazer:
• Na lista de orçamentos, encontre o orçamento que quer duplicar
• Clique no ícone de copiar
• O sistema cria uma cópia exata como rascunho
• Abra o novo orçamento e ajuste o que for necessário
• Vincule ao cliente correto e atualize a data

Dica: ao duplicar, sempre revise os preços. Se o orçamento original é de meses atrás, os custos podem ter mudado.`,
  },
  {
    id: 23,
    category: "Dicas Avançadas",
    title: "Fluxo Completo: Do Lead à Festa",
    difficulty: "intermediario",
    content: `Este é o fluxo ideal para usar o Île Magique do início ao fim de cada negociação.

1. Lead chega (WhatsApp, Instagram, indicação)
   → Adicione no Pipeline como Novo Lead

2. Primeiro contato
   → Converse com o cliente, entenda o que ele quer
   → Mova o card para Contato Feito

3. Monte o orçamento
   → Crie o orçamento no sistema
   → Adicione itens do catálogo ou aplique um pacote
   → Confira a margem de lucro
   → Mova o lead para Orçamento Enviado

4. Envie a proposta
   → Gere o PDF do orçamento
   → Envie por WhatsApp ou e-mail
   → Use cenários para apresentar opções

5. Negociação
   → Cliente pediu ajuste? Edite o orçamento
   → Mova para Negociação no pipeline

6. Fechamento
   → Cliente aprovou! Mova para Fechado
   → Converta o lead em orçamento aprovado
   → O sistema cria o evento na agenda automaticamente

7. Preparação
   → Gere o checklist operacional
   → Compre materiais, confirme fornecedores
   → Vá marcando as tarefas conforme conclui

8. Dia da festa
   → Use o checklist como roteiro de montagem
   → Marque tudo conforme for instalando

9. Pós-evento
   → Mude o status do orçamento para Realizado
   → Confira o lucro real no Dashboard
   → Peça feedback e indicações ao cliente

Dica: esse fluxo completo parece longo, mas depois que você pega o ritmo, cada etapa leva poucos minutos. O Île Magique foi feito para acelerar seu processo, não para complicar.`,
  },
  {
    id: 24,
    category: "Financeiro",
    title: "Registrando Receitas",
    difficulty: "basico",
    content: `Acesse Financeiro no menu lateral e registre cada receita para manter seu controle financeiro em dia.

• Clique em "+ Nova Receita" (botão verde)
• Preencha: descrição (ex: "Festa Ana Silva - Tema Safari"), valor, categoria e forma de pagamento
• Categorias disponíveis: Venda de serviço, Sinal/Entrada, Pagamento parcial, Quitação, Outro
• Formas de pagamento: PIX, Dinheiro, Cartão crédito, Cartão débito, Transferência, Boleto
• Defina o status: Pago (já recebeu) ou Pendente (ainda vai receber)
• Se for pendente, preencha a data de vencimento para controle de cobranças
• Vincule a um cliente e orçamento para manter o histórico conectado

Dica: sempre vincule a receita ao orçamento correspondente — isso facilita o controle`,
  },
  {
    id: 25,
    category: "Financeiro",
    title: "Registrando Despesas",
    difficulty: "basico",
    content: `No Financeiro, registre todas as suas despesas para ter uma visão real da sua margem de lucro.

• Clique em "+ Nova Despesa" (botão vermelho)
• Preencha: descrição (ex: "Compra de balões - Fornecedor X"), valor, categoria e forma de pagamento
• Categorias de despesa: Material, Transporte, Fornecedor, Ajudante, Custo fixo, Outro
• Registre despesas no momento que acontecem para não perder o controle
• Se for uma despesa futura, marque como Pendente e defina a data de vencimento

Dica: registre TODAS as despesas, mesmo as pequenas — elas somam no final do mês e afetam sua margem real`,
  },
  {
    id: 26,
    category: "Financeiro",
    title: "Gerando Pagamentos Automáticos do Orçamento",
    difficulty: "intermediario",
    content: `Automatize a criação de parcelas a partir dos seus orçamentos aprovados.

• No Financeiro, clique em "Gerar do Orçamento"
• Selecione um orçamento aprovado ou pago
• O sistema cria automaticamente as parcelas baseado na condição de pagamento do orçamento
• Exemplo: se a condição é "50% entrada + 50% no evento", ele cria 2 transações
  - Primeira parcela: 50% do valor, vencimento hoje, status pendente
  - Segunda parcela: 50% do valor, vencimento na data do evento, status pendente
• Conforme for recebendo, clique em "Marcar como Pago" em cada parcela
• Você também pode gerar pagamentos direto do editor do orçamento, no botão "Registrar Pagamento"

Dica: gere os pagamentos assim que o orçamento for aprovado para não esquecer de cobrar`,
  },
  {
    id: 27,
    category: "Financeiro",
    title: "Entendendo o Painel Financeiro",
    difficulty: "intermediario",
    content: `O painel financeiro é seu centro de controle de receitas, despesas e saldo.

• O painel financeiro mostra 6 indicadores no topo:
  - Receitas: total que você já recebeu no período
  - Despesas: total que já gastou no período
  - Saldo: receitas menos despesas (seu lucro operacional)
  - A Receber: valores pendentes de clientes
  - A Pagar: despesas pendentes
  - Vencidos: quantos pagamentos estão atrasados (fique atenta a este número!)
• O gráfico de barras mostra a evolução mensal de receitas vs. despesas
• Use os filtros para ver por período, tipo, categoria ou status
• As abas "Receitas", "Despesas", "Pendentes" e "Vencidos" filtram rapidamente

Dica: verifique os "Vencidos" toda semana e entre em contato com os clientes devedores`,
  },
  {
    id: 28,
    category: "Contratos",
    title: "Criando um Contrato",
    difficulty: "basico",
    content: `Acesse Contratos no menu lateral para criar contratos profissionais para suas festas.

• Clique em "+ Novo Contrato" para criar do zero, ou "Gerar do Orçamento" para preencher automaticamente
• Recomendação: sempre gere a partir do orçamento — ele preenche cliente, itens, valores e data automaticamente
• Complete os dados obrigatórios:
  - Dados do evento: data, horário, endereço, duração da festa
  - Horário de montagem e desmontagem
  - Dados do cliente: nome, CPF/CNPJ, endereço
  - Valores: total, valor do sinal, data do sinal, valor restante, data do restante
  - Forma de pagamento
• A política de cancelamento já vem preenchida com um texto padrão — ajuste se necessário
• Use o campo "Cláusulas adicionais" para termos específicos daquele evento

Dica: sempre peça CPF/CNPJ do cliente para o contrato ter validade jurídica`,
  },
  {
    id: 29,
    category: "Contratos",
    title: "Gerando PDF do Contrato",
    difficulty: "basico",
    content: `Gere PDFs profissionais dos seus contratos para enviar aos clientes.

• Na lista de contratos, clique em "Gerar PDF" no contrato desejado
• O PDF é gerado automaticamente com:
  - Cabeçalho com nome da sua empresa
  - Número do contrato (gerado automaticamente, ex: CTR-2026-001)
  - Dados completos do contratante (cliente) e contratada (você)
  - Cláusulas organizadas: objeto, data/local, montagem, serviços, valores, cancelamento
  - Lista de todos os itens do orçamento vinculado
  - Espaço para assinatura de ambas as partes
• Envie o PDF para o cliente assinar (por e-mail, WhatsApp ou presencialmente)
• Após assinatura, mude o status do contrato para "Assinado"

Dica: a cor do contrato segue a cor accent configurada em Configurações — personalize com as cores da sua marca`,
  },
  {
    id: 30,
    category: "Contratos",
    title: "Acompanhando o Status do Contrato",
    difficulty: "basico",
    content: `Acompanhe o ciclo de vida de cada contrato com o sistema de status.

• Todo contrato passa por um fluxo de status:
  - Rascunho: você está montando o contrato
  - Enviado: mandou para o cliente analisar
  - Assinado: cliente assinou o contrato
  - Ativo: festa confirmada, contrato em vigor
  - Concluído: festa realizada com sucesso
  - Cancelado: contrato foi cancelado
• Para mudar o status, clique no botão de status na lista de contratos
• O ideal é: crie o contrato → envie para o cliente → ele assina → marque como ativo → após a festa, conclua

Dica: nunca comece a preparar uma festa sem o contrato assinado — ele protege você e o cliente`,
  },
  {
    id: 31,
    category: "Contratos",
    title: "Integrando Orçamento, Contrato e Financeiro",
    difficulty: "intermediario",
    content: `O fluxo completo integrado conecta orçamento, contrato e financeiro de ponta a ponta.

1. Monte o orçamento com todos os itens e valores
2. Envie o PDF do orçamento para o cliente
3. Cliente aprovou? Mude o status para "Aprovado"
4. Gere o contrato a partir do orçamento (botão "Gerar Contrato" no editor)
5. Envie o contrato para assinatura
6. Gere as parcelas de pagamento (botão "Registrar Pagamento" no editor, ou no Financeiro)
7. Conforme receber, marque cada parcela como paga
8. O Dashboard mostra tudo: faturamento, pendências e saldo

• Tudo fica conectado: orçamento → contrato → pagamentos
• No editor do orçamento, você vê badges indicando se já tem contrato gerado e pagamentos registrados

Dica: siga esse fluxo para TODOS os eventos — é assim que você profissionaliza seu negócio`,
  },
];

/* ------------------------------------------------------------------ */
/*  Category icon map                                                  */
/* ------------------------------------------------------------------ */

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "Primeiros Passos": Rocket,
  "Catálogo e Pacotes": Package,
  "Gestão de Clientes": Users,
  "Orçamentos": FileText,
  "Funil de Vendas": GitBranch,
  "Agenda e Operacional": Calendar,
  "Gestão e Financeiro": BarChart3,
  "Dicas Avançadas": Sparkles,
  "Financeiro": DollarSign,
  "Contratos": FileSignature,
};

const categories = [
  "Todos",
  "Primeiros Passos",
  "Catálogo e Pacotes",
  "Gestão de Clientes",
  "Orçamentos",
  "Funil de Vendas",
  "Agenda e Operacional",
  "Gestão e Financeiro",
  "Financeiro",
  "Contratos",
  "Dicas Avançadas",
];

const STORAGE_KEY = "ilemagique_tutorials_seen";

/* ------------------------------------------------------------------ */
/*  Helper: render tutorial content with formatting                    */
/* ------------------------------------------------------------------ */

function renderContent(content: string) {
  const paragraphs = content.split("\n\n");
  return paragraphs.map((p, i) => {
    const lines = p.split("\n");
    return (
      <div key={i} className="mb-4 last:mb-0">
        {lines.map((line, j) => {
          const trimmed = line.trimStart();
          if (trimmed.startsWith("•")) {
            return (
              <div key={j} className="flex gap-2 pl-2 py-0.5">
                <span className="text-[#4A5BA8] mt-0.5 shrink-0">•</span>
                <span>{trimmed.slice(1).trim()}</span>
              </div>
            );
          }
          if (trimmed.startsWith("- ")) {
            return (
              <div key={j} className="flex gap-2 pl-6 py-0.5">
                <span className="text-[#7880A0] mt-0.5 shrink-0">-</span>
                <span>{trimmed.slice(1).trim()}</span>
              </div>
            );
          }
          if (/^\d+\./.test(trimmed)) {
            return (
              <div key={j} className="flex gap-2 pl-2 py-0.5">
                <span className="text-[#4A5BA8] font-semibold shrink-0">
                  {trimmed.match(/^\d+\./)![0]}
                </span>
                <span>{trimmed.replace(/^\d+\.\s*/, "")}</span>
              </div>
            );
          }
          if (trimmed.startsWith("→")) {
            return (
              <div key={j} className="flex gap-2 pl-8 py-0.5 text-[#7880A0]">
                <span className="shrink-0">→</span>
                <span>{trimmed.slice(1).trim()}</span>
              </div>
            );
          }
          if (trimmed.startsWith("Dica:")) {
            return (
              <p
                key={j}
                className="mt-2 rounded-lg bg-[#FFF8EC] border border-[#E8A030]/20 px-3 py-2 text-sm text-[#1E2247]"
              >
                <span className="font-semibold text-[#E8A030]">Dica:</span>
                {trimmed.slice(5)}
              </p>
            );
          }
          return (
            <p key={j} className={j > 0 ? "mt-1" : ""}>
              {line}
            </p>
          );
        })}
      </div>
    );
  });
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function TutorialsPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [seen, setSeen] = useState<Set<number>>(new Set());

  /* Load seen from localStorage on mount */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const ids: number[] = JSON.parse(stored);
        setSeen(new Set(ids));
      }
    } catch {
      /* ignore */
    }
  }, []);

  /* Persist seen to localStorage */
  const persistSeen = (next: Set<number>) => {
    setSeen(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
    } catch {
      /* ignore */
    }
  };

  const toggleExpanded = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSeen = (id: number) => {
    const next = new Set(seen);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    persistSeen(next);
  };

  /* Filtered tutorials */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tutorials.filter((t) => {
      const matchesCategory =
        activeCategory === "Todos" || t.category === activeCategory;
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.content.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  const progress = tutorials.length > 0 ? (seen.size / tutorials.length) * 100 : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <BookOpen className="size-8 text-[#4A5BA8]" />
          <h1 className="text-3xl font-bold text-[#1E2247]">Central de Ajuda</h1>
        </div>
        <p className="text-[#7880A0]">
          Aprenda a usar todas as funcionalidades do Île Magique
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-[#1E2247]">
            {seen.size} de {tutorials.length} tutoriais completados
          </span>
          <span className="text-[#7880A0]">{Math.round(progress)}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-[#E2E4EE]">
          <div
            className="h-full rounded-full bg-[#5AAF50] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7880A0]" />
        <Input
          placeholder="Buscar tutoriais..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 pl-9 border-[#E2E4EE] bg-white"
        />
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          const Icon = cat !== "Todos" ? categoryIcons[cat] : null;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#4A5BA8] text-white"
                  : "bg-white text-[#7880A0] border border-[#E2E4EE] hover:bg-[#FAFBFE] hover:text-[#1E2247]"
              }`}
            >
              {Icon && <Icon className="size-3.5" />}
              {cat}
            </button>
          );
        })}
      </div>

      {/* Tutorial cards grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-[#7880A0]">
          <Search className="mx-auto mb-3 size-10 opacity-40" />
          <p className="text-lg font-medium">Nenhum tutorial encontrado</p>
          <p className="text-sm">Tente buscar com outros termos</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((tutorial) => {
            const isExpanded = expanded.has(tutorial.id);
            const isSeen = seen.has(tutorial.id);
            const Icon = categoryIcons[tutorial.category];
            const snippet =
              tutorial.content.length > 80
                ? tutorial.content.slice(0, 80).trim() + "..."
                : tutorial.content;

            return (
              <Card
                key={tutorial.id}
                className={`cursor-pointer transition-shadow hover:shadow-md ${
                  isExpanded ? "md:col-span-2" : ""
                } ${isSeen ? "ring-[#5AAF50]/30" : ""}`}
              >
                <CardContent className="p-0">
                  {/* Card header - clickable */}
                  <button
                    onClick={() => toggleExpanded(tutorial.id)}
                    className="flex w-full items-start gap-3 p-4 text-left"
                  >
                    {/* Icon */}
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#4A5BA8]/10">
                      {Icon && <Icon className="size-5 text-[#4A5BA8]" />}
                    </div>

                    {/* Text */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-[#1E2247] leading-tight">
                          {tutorial.title}
                        </h3>
                        {isSeen && (
                          <CheckCircle2 className="size-4 shrink-0 text-[#5AAF50]" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#7880A0]">
                          {tutorial.category}
                        </span>
                        <Badge
                          className={`text-[10px] px-1.5 py-0 h-4 ${
                            tutorial.difficulty === "basico"
                              ? "bg-[#EEF7ED] text-[#5AAF50]"
                              : "bg-[#FFF8EC] text-[#E8A030]"
                          }`}
                        >
                          {tutorial.difficulty === "basico"
                            ? "Básico"
                            : "Intermediário"}
                        </Badge>
                      </div>
                      {!isExpanded && (
                        <p className="text-sm text-[#7880A0] leading-relaxed">
                          {snippet}
                        </p>
                      )}
                    </div>

                    {/* Expand icon */}
                    <div className="shrink-0 pt-1">
                      {isExpanded ? (
                        <ChevronUp className="size-5 text-[#7880A0]" />
                      ) : (
                        <ChevronDown className="size-5 text-[#7880A0]" />
                      )}
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-[#E2E4EE] px-4 py-4 space-y-4">
                      <div className="text-sm leading-relaxed text-[#1E2247]">
                        {renderContent(tutorial.content)}
                      </div>
                      <div className="flex justify-end pt-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSeen(tutorial.id);
                          }}
                          variant={isSeen ? "outline" : "default"}
                          size="sm"
                          className={
                            isSeen
                              ? "border-[#5AAF50] text-[#5AAF50] hover:bg-[#EEF7ED]"
                              : "bg-[#4A5BA8] hover:bg-[#4A5BA8]/90"
                          }
                        >
                          <CheckCircle2 className="size-4 mr-1" />
                          {isSeen
                            ? "Lido — clique para desmarcar"
                            : "Marcar como lido"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
