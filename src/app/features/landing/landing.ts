import { Component } from '@angular/core';
import { HeroSection } from './sections/hero-section/hero-section';
import { FooterSection } from './sections/footer-section/footer-section';

@Component({
  selector: 'app-landing',
  imports: [HeroSection, FooterSection],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {}
