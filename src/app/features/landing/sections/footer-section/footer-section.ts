import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-footer-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
  templateUrl: './footer-section.html',
  styleUrl: './footer-section.css',
})
export class FooterSection {
  // Ano atual exibido na linha de copyright do rodape.
  readonly anoAtual = new Date().getFullYear();
}
