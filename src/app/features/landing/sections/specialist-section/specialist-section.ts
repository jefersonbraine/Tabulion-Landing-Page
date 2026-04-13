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

type CredencialEspecialista = {
  // Rotulo curto exibido na coluna esquerda.
  label: string;
  // Valor institucional exibido na coluna direita.
  value: string;
};

@Component({
  selector: 'app-specialist-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
  templateUrl: './specialist-section.html',
  styleUrl: './specialist-section.css',
})
export class SpecialistSection implements AfterViewInit {
  // Referencia de destroy para limpar observers no fim do ciclo de vida.
  private readonly referenciaDestruicao = inject(DestroyRef);
  // Identificador de plataforma para evitar APIs de browser no SSR.
  private readonly idPlataforma = inject(PLATFORM_ID);

  // Bloco da coluna esquerda (identidade do especialista).
  readonly cabecalhoEspecialista = viewChild<ElementRef<HTMLElement>>('cabecalhoEspecialista');
  // Cards de credenciais na coluna direita.
  readonly linhasCredencial = viewChildren<ElementRef<HTMLElement>>('linhaCredencial');

  // Estado visual da coluna esquerda.
  private readonly cabecalhoVisivel = signal(false);
  // Indices de credenciais que ja entraram em cena.
  private readonly indicesCredenciaisVisiveis = signal<number[]>([]);

  readonly credenciais: CredencialEspecialista[] = [
    { label: 'Cargo Atual', value: 'Oficial Substituto - Cerro Azul, PR' },
    {
      label: 'Especialização',
      value: 'Direito e Gestão Notarial e Registral - Direito Civil e Processo Civil',
    },
    { label: 'Experiência', value: 'Mais de 4 anos em serventias notariais' },
    { label: 'Formação', value: 'Engenharia de Software - Serviços Jurídicos e Notariais' },
  ];

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.idPlataforma)) {
      return;
    }

    // Fallback para testes e ambientes sem suporte a observers.
    if (typeof IntersectionObserver === 'undefined') {
      this.cabecalhoVisivel.set(true);
      this.indicesCredenciaisVisiveis.set(this.credenciais.map((_, indice) => indice));
      return;
    }

    this.iniciarObservadorCabecalho();
    this.iniciarObservadorCredenciais();
  }

  cabecalhoEstaVisivel(): boolean {
    return this.cabecalhoVisivel();
  }

  credencialEstaVisivel(indice: number): boolean {
    return this.indicesCredenciaisVisiveis().includes(indice);
  }

  atrasoCredencial(indice: number): string {
    return `${indice * 0.1}s`;
  }

  private iniciarObservadorCabecalho(): void {
    const elementoCabecalho = this.cabecalhoEspecialista()?.nativeElement;

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

  private iniciarObservadorCredenciais(): void {
    const elementosCredenciais = this.linhasCredencial().map((linha) => linha.nativeElement);

    if (elementosCredenciais.length === 0) {
      return;
    }

    const observadorCredenciais = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) {
            continue;
          }

          const atributoIndice = entrada.target.getAttribute('data-indice-credencial');
          const indice = atributoIndice ? Number(atributoIndice) : Number.NaN;

          if (!Number.isNaN(indice)) {
            this.indicesCredenciaisVisiveis.update((indicesAtuais) => {
              if (indicesAtuais.includes(indice)) {
                return indicesAtuais;
              }

              return [...indicesAtuais, indice];
            });
          }

          observadorCredenciais.unobserve(entrada.target);
        }
      },
      { threshold: 0.08 },
    );

    for (const elementoCredencial of elementosCredenciais) {
      observadorCredenciais.observe(elementoCredencial);
    }

    this.referenciaDestruicao.onDestroy(() => {
      observadorCredenciais.disconnect();
    });
  }
}
