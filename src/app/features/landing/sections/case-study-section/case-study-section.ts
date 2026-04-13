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

type ResultadoCaso = {
  // Valor numerico usado na contagem animada.
  metrica: number | null;
  // Sufixo exibido ao lado do numero (ex.: %).
  sufixo?: string;
  // Prefixo exibido antes do numero (ex.: ↑/↓).
  prefixo?: string;
  // Valor textual fixo quando nao houver contagem numerica.
  exibicaoFixa?: string;
  // Titulo curto da metrica.
  rotulo: string;
  // Explicacao da metrica em linguagem de negocio.
  descricao: string;
};

@Component({
  selector: 'app-case-study-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
  templateUrl: './case-study-section.html',
  styleUrl: './case-study-section.css',
})
export class CaseStudySection implements AfterViewInit {
  // Referencia de destroy para limpar observers e animacoes.
  private readonly referenciaDestruicao = inject(DestroyRef);
  // Identificador da plataforma para proteger execucao no SSR.
  private readonly idPlataforma = inject(PLATFORM_ID);

  // Bloco de cabecalho observado para animacao de entrada.
  readonly cabecalhoCaso = viewChild<ElementRef<HTMLElement>>('cabecalhoCaso');
  // Cards de resultado observados para entrada em cascata.
  readonly cardsResultado = viewChildren<ElementRef<HTMLElement>>('cardResultado');

  // Estado visual do cabecalho principal da secao.
  private readonly cabecalhoVisivel = signal(false);
  // Indices dos cards que ja devem aparecer.
  private readonly indicesCardsVisiveis = signal<number[]>([]);
  // Valores atuais da contagem animada por card.
  private readonly contadoresMetricas = signal<number[]>([]);

  // IDs de requestAnimationFrame para permitir cancelamento no destroy.
  private readonly idsAnimacao: number[] = [];

  // Dados do estudo de caso reproduzindo a versao do Design.
  readonly resultadosCaso: ResultadoCaso[] = [
    {
      metrica: 100,
      sufixo: '%',
      prefixo: '↑',
      rotulo: 'Organização do Servidor',
      descricao:
        'A estrutura de diretórios passou de caótica a auditável. Cada documento ocupa o lugar correto, com nomenclatura padronizada e rastreável.',
    },
    {
      metrica: 80,
      sufixo: '%',
      prefixo: '↓',
      rotulo: 'Tempo em Burocracia',
      descricao:
        'Triagem documental, renomeação e classificação — tarefas antes manuais — agora são executadas pelo robô com precisão milimétrica.',
    },
    {
      metrica: null,
      exibicaoFixa: '24/7',
      rotulo: 'Emissão Autônoma',
      descricao:
        'Certidões fiscais obtidas de portais governamentais sem intervenção humana, mesmo fora do horário de expediente.',
    },
    {
      metrica: null,
      exibicaoFixa: '∞',
      rotulo: 'Soberania Digital',
      descricao:
        'O Tabulion opera offline-first. Nenhum dado sensível trafega para fora do ambiente controlado da serventia.',
    },
  ];

  constructor() {
    this.contadoresMetricas.set(this.resultadosCaso.map(() => 0));
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.idPlataforma)) {
      return;
    }

    // Fallback para testes (jsdom) e ambientes sem suporte a IntersectionObserver.
    if (typeof IntersectionObserver === 'undefined') {
      this.cabecalhoVisivel.set(true);
      this.indicesCardsVisiveis.set(this.resultadosCaso.map((_, indice) => indice));
      this.contadoresMetricas.set(
        this.resultadosCaso.map((resultado) =>
          resultado.metrica === null ? 0 : resultado.metrica,
        ),
      );
      return;
    }

    this.iniciarObservadorCabecalho();
    this.iniciarObservadorCards();

    this.referenciaDestruicao.onDestroy(() => {
      for (const idAnimacao of this.idsAnimacao) {
        window.cancelAnimationFrame(idAnimacao);
      }
    });
  }

  // Informa ao template se o cabecalho ja entrou em cena.
  cabecalhoEstaVisivel(): boolean {
    return this.cabecalhoVisivel();
  }

  // Informa ao template se um card especifico ja deve aparecer.
  cardEstaVisivel(indice: number): boolean {
    return this.indicesCardsVisiveis().includes(indice);
  }

  // Fornece atraso progressivo da entrada dos cards.
  atrasoCard(indice: number): string {
    return `${indice * 0.12}s`;
  }

  // Retorna valor atual da contagem animada de um card numerico.
  valorContador(indice: number): number {
    return this.contadoresMetricas()[indice] ?? 0;
  }

  // Observa o cabecalho da secao e ativa animacao quando visivel.
  private iniciarObservadorCabecalho(): void {
    const elementoCabecalho = this.cabecalhoCaso()?.nativeElement;

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

  // Observa cards para entrada em cascata e inicio de contagem.
  private iniciarObservadorCards(): void {
    const elementosCards = this.cardsResultado().map((card) => card.nativeElement);

    if (elementosCards.length === 0) {
      return;
    }

    const observadorCards = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) {
            continue;
          }

          const atributoIndice = entrada.target.getAttribute('data-indice-card');
          const indice = atributoIndice ? Number(atributoIndice) : Number.NaN;

          if (!Number.isNaN(indice)) {
            this.indicesCardsVisiveis.update((indicesAtuais) => {
              if (indicesAtuais.includes(indice)) {
                return indicesAtuais;
              }

              return [...indicesAtuais, indice];
            });

            this.iniciarContagemMetrica(indice);
          }

          observadorCards.unobserve(entrada.target);
        }
      },
      { threshold: 0.08 },
    );

    for (const elementoCard of elementosCards) {
      observadorCards.observe(elementoCard);
    }

    this.referenciaDestruicao.onDestroy(() => {
      observadorCards.disconnect();
    });
  }

  // Executa animacao numerica suave para metrica percentual.
  private iniciarContagemMetrica(indice: number): void {
    const resultado = this.resultadosCaso[indice];

    if (!resultado || resultado.metrica === null) {
      return;
    }

    const valorFinal = resultado.metrica;
    const duracaoMs = 1800;
    let tempoInicial: number | null = null;

    const animar = (tempoAtual: number): void => {
      if (tempoInicial === null) {
        tempoInicial = tempoAtual;
      }

      const progressoLinear = Math.min((tempoAtual - tempoInicial) / duracaoMs, 1);
      const progressoSuave = 1 - Math.pow(1 - progressoLinear, 3);
      const valorAtual = Math.round(progressoSuave * valorFinal);

      this.contadoresMetricas.update((valoresAtuais) => {
        const proximo = [...valoresAtuais];
        proximo[indice] = valorAtual;
        return proximo;
      });

      if (progressoLinear < 1) {
        const idAnimacao = window.requestAnimationFrame(animar);
        this.idsAnimacao.push(idAnimacao);
      }
    };

    const idAnimacao = window.requestAnimationFrame(animar);
    this.idsAnimacao.push(idAnimacao);
  }
}
