import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();
const router = Router();

// Configuração do Nodemailer
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io", // Host do Mailtrap
  port: 587,
  secure: false,
  auth: {
    user: "5fb14690f5fffb", // Seu usuário do Mailtrap
    pass: "3d18fdc7c7fd44", // Sua senha do Mailtrap
  }
});

// Função para enviar e-mail
async function enviaEmail(nome: string, email: string, descricao: string, linkAfiliado: string) {
  const info = await transporter.sendMail({
    from: 'guilhermedrsilva7@gmail.com', // seu e-mail
    to: email, // e-mail do cliente
    subject: "Confirmação de Compra",// Assunto
    text: `Sua compra foi realizada: ${descricao}\nLink do Produto: ${linkAfiliado}`, // Texto simples
    html: `<h3>Estimado Cliente: ${nome}</h3>
           <h3>Descrição da Compra: ${descricao}</h3>
           <a href="${linkAfiliado}">Clique aqui para acessar o produto</a>
           <p>Muito obrigado pelo seu contato</p>
           <p>Revenda x</p>`
  });

  console.log("Message sent: %s", info.messageId);
}

// Listar todas as compras
router.get("/", async (req, res) => {
  try {
    const compras = await prisma.compra.findMany({
      include: {
        cliente: true,
        produto: true // Inclui informações do produto
      }
    });
    res.status(200).json(compras);
  } catch (error) {
    res.status(400).json(error);
  }
});

// Criar uma nova compra
router.post("/", async (req, res) => {
  const { clienteId, produtoId, descricao } = req.body;

  if (!clienteId || !produtoId) {
    res.status(400).json({ "erro": "Informe clienteId, produtoId" });
    return;
  }

  try {
    const produto = await prisma.produto.findUnique({
      where: { id: produtoId },
      select: { linkAfiliado: true } // Seleciona apenas o linkAfiliado do produto
    });

    if (!produto) {
      return res.status(404).json({ "erro": "Produto não encontrado." });
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { nome: true, email: true } // Seleciona nome e e-mail do cliente
    });

    if (!cliente) {
      return res.status(404).json({ "erro": "Cliente não encontrado." });
    }

    const compra = await prisma.compra.create({
      data: {
        clienteId,
        produtoId,
        descricao,
      }
    });

    // Envia e-mail para o cliente
    if (cliente.email && produto.linkAfiliado) {
      await enviaEmail(cliente.nome, cliente.email, descricao, produto.linkAfiliado);
    } else {
      res.status(400).json({ "erro": "Email do cliente ou link afiliado do produto está ausente." });
      return;
    }

    // Retorna a compra criada junto com o link de afiliado do produto
    res.status(201).json({ compra, linkAfiliado: produto.linkAfiliado });
  } catch (error) {
    res.status(400).json(error);
  }
});

// Deletar uma compra
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const compra = await prisma.compra.delete({
      where: { id: Number(id) }
    });
    res.status(200).json(compra);
  } catch (error) {
    res.status(400).json(error);
  }
});

// Atualizar uma compra
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { clienteId, produtoId, descricao } = req.body;

  if (!clienteId || !produtoId) {
    res.status(400).json({ "erro": "Informe clienteId, produtoId e descricao." });
    return;
  }

  try {
    const compra = await prisma.compra.update({
      where: { id: Number(id) },
      data: { clienteId, produtoId, descricao }
    });
    res.status(200).json(compra);
  } catch (error) {
    res.status(400).json(error);
  }
});

// Listar compras de um cliente específico
router.get("/:clienteId", async (req, res) => {
  const { clienteId } = req.params;
  try {
    const compras = await prisma.compra.findMany({
      where: { clienteId },
      include: {
        produto: true // Inclui informações do produto
      }
    });
    res.status(200).json(compras);
  } catch (error) {
    res.status(400).json(error);
  }
});

export default router;
