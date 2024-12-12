import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const router = Router();

// Middleware para validação de senha
function validaSenha(senha: string): string[] {
  const mensagens: string[] = [];

  if (senha.length < 8) {
    mensagens.push("A senha deve ter pelo menos 8 caracteres.");
  }

  let minusculas = 0;
  let maiusculas = 0;
  let numeros = 0;
  let simbolos = 0;

  for (const char of senha) {
    if (/[a-z]/.test(char)) minusculas++;
    else if (/[A-Z]/.test(char)) maiusculas++;
    else if (/[0-9]/.test(char)) numeros++;
    else simbolos++;
  }

  if (!minusculas || !maiusculas || !numeros || !simbolos) {
    mensagens.push("A senha deve conter letras maiúsculas, minúsculas, números e símbolos.");
  }

  return mensagens;
}

// Rota para listar todos os administradores
router.get("/", async (req, res) => {
  try {
    const admins = await prisma.admin.findMany({
      select: { id: true, nome: true, email: true, createdAt: true, updatedAt: true }, // Evita retornar a senha
    });
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar administradores." });
  }
});

// Rota para criar um administrador
router.post("/", async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    res.status(400).json({ error: "Nome, email e senha são obrigatórios." });
    return;
  }

  const errosSenha = validaSenha(senha);
  if (errosSenha.length > 0) {
    res.status(400).json({ error: errosSenha.join("; ") });
    return;
  }

  const salt = bcrypt.genSaltSync(12);
  const senhaHash = bcrypt.hashSync(senha, salt);

  try {
    const novoAdmin = await prisma.admin.create({
      data: { nome, email, senha: senhaHash },
    });
    res.status(201).json({ id: novoAdmin.id, nome: novoAdmin.nome, email: novoAdmin.email });
  } catch (error) {
    res.status(400).json({ error: "Erro ao criar administrador." });
  }
});

// Rota de login
router.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    res.status(400).json({ error: "Email e senha são obrigatórios." });
    return;
  }

  try {
    const admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin) {
      res.status(401).json({ error: "Email ou senha incorretos." });
      return;
    }

    const senhaValida = bcrypt.compareSync(senha, admin.senha);
    if (!senhaValida) {
      res.status(401).json({ error: "Email ou senha incorretos." });
      return;
    }

    const token = jwt.sign(
      { adminId: admin.id, adminNome: admin.nome },
      process.env.JWT_KEY as string,
      { expiresIn: "1h" }
    );

    res.status(200).json({ id: admin.id, nome: admin.nome, token });
  } catch (error) {
    res.status(500).json({ error: "Erro no processo de login." });
  }
});

export default router;
