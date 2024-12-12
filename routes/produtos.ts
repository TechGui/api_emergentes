import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { verificaToken } from "../middewares/verificaToken";

const prisma = new PrismaClient();
const router = Router();

router.get("/", async (req, res) => {
  try {
    const produtos = await prisma.produto.findMany({
      include: {
        marca: true,
      },
    });
    res.status(200).json(produtos);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.post("/", verificaToken, async (req, res) => {
  const { preco, destaque, foto, especificacoes, categoria, marcaId, descricao, modelo, formato, material, genero, linkAfiliado } = req.body;

  if (!preco || !foto || !especificacoes || !categoria || !marcaId || !descricao || !modelo || !destaque || !formato || !material || !genero || !linkAfiliado) {
    res.status(400).json({
      erro: "Informe preco, foto, especificacoes, categoria, marcaId, descricao, modelo, destaque, formato, material, genero e linkAfiliado",
    });
    return;
  }

  try {
    const produto = await prisma.produto.create({
      data: { preco, destaque, foto, especificacoes, categoria, marcaId, descricao, modelo, formato, material, genero, linkAfiliado },
    });
    res.status(201).json(produto);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.delete("/:id", verificaToken, async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.foto.deleteMany({
      where: { produtoId: Number(id) },
    });

    await prisma.compra.deleteMany({
      where: { produtoId: Number(id) },
    });

    const produto = await prisma.produto.delete({
      where: { id: Number(id) },
    });
    res.status(200).json(produto);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.put("/:id", verificaToken, async (req, res) => {
  const { id } = req.params;
  const { preco, destaque, foto, especificacoes, categoria, marcaId, descricao, modelo, formato, material, genero, linkAfiliado } = req.body;

  if (!preco || !destaque || !foto || !especificacoes || !categoria || !marcaId || !descricao || !modelo || !formato || !material || !genero || !linkAfiliado) {
    res.status(400).json({
      erro: "Informe preco, foto, especificacoes, categoria, marcaId, descricao, modelo, destaque, formato, material, genero e linkAfiliado",
    });
    return;
  }

  try {
    const produto = await prisma.produto.update({
      where: { id: Number(id) },
      data: { preco, destaque, foto, especificacoes, categoria, marcaId, descricao, modelo, formato, material, genero, linkAfiliado },
    });
    res.status(200).json(produto);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.get("/pesquisa/:termo", async (req, res) => {
  const { termo } = req.params;

  const termoNumero = Number(termo);

  if (isNaN(termoNumero)) {
    try {
      const produtos = await prisma.produto.findMany({
        include: {
          marca: true,
        },
        where: {
          OR: [
            { modelo: { contains: termo } },
            { marca: { nome: termo } },
            { formato: { contains: termo } },
            { material: { contains: termo } },
            { genero: { contains: termo } },
          ],
        },
      });
      res.status(200).json(produtos);
    } catch (error) {
      res.status(400).json(error);
    }
  } else {
    try {
      const produtos = await prisma.produto.findMany({
        include: {
          marca: true,
        },
        where: {
          preco: { lte: termoNumero },
        },
      });
      res.status(200).json(produtos);
    } catch (error) {
      res.status(400).json(error);
    }
  }
});

router.get("/destaques", async (req, res) => {
  try {
    const produtos = await prisma.produto.findMany({
      orderBy: { id: "desc" },
      include: {
        marca: true,
      },
      where: { destaque: true },
    });
    res.status(200).json(produtos);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.put("/destacar/:id", verificaToken, async (req, res) => {
  const { id } = req.params;

  try {
    const produtoDestacar = await prisma.produto.findUnique({
      where: { id: Number(id) },
      select: { destaque: true },
    });

    const produto = await prisma.produto.update({
      where: { id: Number(id) },
      data: { destaque: !produtoDestacar?.destaque },
    });
    res.status(200).json(produto);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const produto = await prisma.produto.findUnique({
      where: { id: Number(id) },
      include: {
        marca: true,
      },
    });
    res.status(200).json(produto);
  } catch (error) {
    res.status(400).json(error);
  }
});

export default router;
