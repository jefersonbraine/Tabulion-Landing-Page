import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type ModuloSolucao = {
  // Identificador visual do modulo na linha (A, B, C...).
  id: string;
  // Titulo principal do modulo.
  titulo: string;
  // Subtitulo de contexto do modulo.
  subtitulo: string;
  // Texto descritivo do que o modulo executa.
  descricao: string;
  // Lista de capacidades/chaves apresentadas abaixo do titulo.
  tags: string[];
};

@Component({
  selector: 'app-solution-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
  templateUrl: './solution-section.html',
  styleUrl: './solution-section.css',
})
export class SolutionSection {
  // Referencia para limpar observadores quando o componente for destruido.
  private readonly referenciaDestruicao = inject(DestroyRef);
  // Identifica plataforma para evitar APIs de browser no SSR.
  private readonly idPlataforma = inject(PLATFORM_ID);

  // Referencia do bloco de cabecalho animado da secao.
  readonly cabecalhoSolucao = viewChild<ElementRef<HTMLElement>>('cabecalhoSolucao');
  // Referencias de cada linha da grade de modulos para animacao escalonada.
  readonly linhasSolucao = viewChildren<ElementRef<HTMLElement>>('linhaSolucao');

  // Estado de visibilidade do cabecalho para animacao de entrada.
  private readonly cabecalhoVisivel = signal(false);
  // Indices das linhas ja visiveis para animacao em cascata.
  private readonly indicesLinhasVisiveis = signal<number[]>([]);

  // Estrutura dos tres modulos centrais da solucao Tabulion.
  readonly modulos: ModuloSolucao[] = [
    {
      id: 'A',
      titulo: 'Organização Documental Inteligente',
      subtitulo: 'Estrutura de Pastas Automatizada',
      descricao:
        'O Tabulion cria, valida e mantém a estrutura de diretórios da serventia de forma autônoma. Cada cliente tem sua pasta, cada documento ocupa o lugar exato — nomeado segundo o padrão definido pelo Tabelião, sem intervenção humana.',
      tags: [
        'Criação automática de pastas',
        'Renomeação padronizada',
        'Sem hardcoding — 100% configurável',
      ],
    },
    {
      id: 'B',
      titulo: 'OCR com Classificação Contextual',
      subtitulo: 'Reconhecimento e Categorização',
      descricao:
        'Imagens recebidas são convertidas em PDF, processadas pelo Tesseract OCR e classificadas automaticamente por tipo de documento — RG, CPF, Escritura, Procuração, Contrato. O sistema decide a pasta de destino e nomeia o arquivo sem interação humana.',
      tags: ['Conversão img → PDF', 'Tesseract com fallback por nome', 'Classificação multi-tipo'],
    },
    {
      id: 'C',
      titulo: 'Emissão Autônoma de Certidões',
      subtitulo: 'Robôs nos Portais Governamentais',
      descricao:
        'Com apenas nome, CPF e data de nascimento do cliente, o Tabulion acessa os portais da Receita Federal, TRF4, CNDT e Receita Estadual, preenche formulários, aguarda respostas, faz download e organiza cada certidão na pasta correta. Tudo sem o operador.',
      tags: [
        'RF · TRF4 · CNDT · Receita Estadual',
        'CAPTCHA assistido apenas quando necessário',
        'Download com verificação de integridade',
      ],
    },
  ];

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.idPlataforma)) {
      return;
    }

    this.iniciarObservadorCabecalho();
    this.iniciarObservadorLinhas();
  }

  // Exposto ao template para aplicar classe de estado no cabecalho.
  cabecalhoEstaVisivel(): boolean {
    return this.cabecalhoVisivel();
  }

  // Exposto ao template para saber se a linha ja deve aparecer.
  linhaEstaVisivel(indice: number): boolean {
    return this.indicesLinhasVisiveis().includes(indice);
  }

  // Define atraso progressivo da animacao de cada linha.
  atrasoLinha(indice: number): string {
    return `${indice * 0.1}s`;
  }

  // Observa o cabecalho e ativa animacao quando entra na viewport.
  private iniciarObservadorCabecalho(): void {
    const elementoCabecalho = this.cabecalhoSolucao()?.nativeElement;

    if (!elementoCabecalho) {
      return;
    }

    const observadorCabecalho = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) {
            continue;
          }

          this.cabecalhoVisivel.set(true);
          observadorCabecalho.unobserve(entrada.target);
        }
      },
      { threshold: 0.05 },
    );

    observadorCabecalho.observe(elementoCabecalho);

    this.referenciaDestruicao.onDestroy(() => {
      observadorCabecalho.disconnect();
    });
  }

  // Observa linhas da grade e ativa animacao individual ao entrar na viewport.
  private iniciarObservadorLinhas(): void {
    const elementosLinhas = this.linhasSolucao().map((linha) => linha.nativeElement);

    if (elementosLinhas.length === 0) {
      return;
    }

    const observadorLinhas = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) {
            continue;
          }

          const atributoIndice = entrada.target.getAttribute('data-indice-linha');
          const indice = atributoIndice ? Number(atributoIndice) : Number.NaN;

          if (!Number.isNaN(indice)) {
            this.indicesLinhasVisiveis.update((indicesAtuais) => {
              if (indicesAtuais.includes(indice)) {
                return indicesAtuais;
              }

              return [...indicesAtuais, indice];
            });
          }

          observadorLinhas.unobserve(entrada.target);
        }
      },
      { threshold: 0.08 },
    );

    for (const elementoLinha of elementosLinhas) {
      observadorLinhas.observe(elementoLinha);
    }

    this.referenciaDestruicao.onDestroy(() => {
      observadorLinhas.disconnect();
    });
  }
}
