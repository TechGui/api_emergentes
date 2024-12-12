import { PrismaClient } from "@prisma/client";
import { Router } from "express";

const prisma = new PrismaClient();
const router = Router();

// Rota para métricas gerais
router.get("/gerais", async (req, res) => {
  try {
    const clientes = await prisma.cliente.count();
    const produtos = await prisma.produto.count();
    const compras = await prisma.compra.count();
    res.status(200).json({ clientes, produtos, compras });
  } catch (error) {
    res.status(400).json(error);
  }
});

// Rota para contar produtos por marca
router.get("/produtosMarca", async (req, res) => {
  try {
    const produtos = await prisma.produto.groupBy({
      by: ["marcaId"],
      _count: {
        id: true,
      },
    });

    // Para cada grupo de produtos, inclui o nome da marca relacionada
    const produtosPorMarca = await Promise.all(
      produtos.map(async (produto) => {
        const marca = await prisma.marca.findUnique({
          where: { id: produto.marcaId },
        });
        return {
          marca: marca?.nome,
          quantidade: produto._count.id,
        };
      })
    );
    res.status(200).json(produtosPorMarca);
  } catch (error) {
    res.status(400).json(error);
  }
});

// Rota para produtos em destaque
router.get("/produtosDestaque", async (req, res) => {
  try {
    const produtosDestaque = await prisma.produto.findMany({
      where: { destaque: true },
      select: {
        id: true,
        modelo: true,
        preco: true,
        marca: {
          select: {
            nome: true,
          },
        },
      },
    });
    res.status(200).json(produtosDestaque);
  } catch (error) {
    res.status(400).json(error);
  }
});

// Rota para categorias de produtos
router.get("/produtosCategoria", async (req, res) => {
  try {
    const produtosCategoria = await prisma.produto.groupBy({
      by: ["categoria"],
      _count: {
        id: true,
      },
    });
    res.status(200).json(produtosCategoria);
  } catch (error) {
    res.status(400).json(error);
  }
});

export default router;
