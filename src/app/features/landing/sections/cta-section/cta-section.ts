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
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-cta-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './cta-section.html',
  styleUrl: './cta-section.css',
})
export class CtaSection implements AfterViewInit {
  private readonly referenciaDestruicao = inject(DestroyRef);
  private readonly idPlataforma = inject(PLATFORM_ID);

  readonly cabecalho = viewChild<ElementRef<HTMLElement>>('cabecalhoCta');
  readonly painelContato = viewChild<ElementRef<HTMLElement>>('painelContato');
  readonly notaFinal = viewChild<ElementRef<HTMLElement>>('notaFinal');

  private readonly cabecalhoVisivel = signal(false);
  private readonly painelVisivel = signal(false);
  private readonly notaVisivel = signal(false);

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.idPlataforma)) {
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      this.cabecalhoVisivel.set(true);
      this.painelVisivel.set(true);
      this.notaVisivel.set(true);
      return;
    }

    this.iniciarObservador(this.cabecalho, () => this.cabecalhoVisivel.set(true));
    this.iniciarObservador(this.painelContato, () => this.painelVisivel.set(true));
    this.iniciarObservador(this.notaFinal, () => this.notaVisivel.set(true));
  }

  cabecalhoEstaVisivel(): boolean {
    return this.cabecalhoVisivel();
  }

  painelEstaVisivel(): boolean {
    return this.painelVisivel();
  }

  notaEstaVisivel(): boolean {
    return this.notaVisivel();
  }

  private iniciarObservador(
    referencia: () => ElementRef<HTMLElement> | undefined,
    aoEntrarEmCena: () => void,
  ): void {
    const elemento = referencia()?.nativeElement;

    if (!elemento) {
      return;
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) {
            continue;
          }

          aoEntrarEmCena();
          observador.unobserve(entrada.target);
        }
      },
      { threshold: 0.05 },
    );

    observador.observe(elemento);
    this.referenciaDestruicao.onDestroy(() => observador.disconnect());
  }
}
