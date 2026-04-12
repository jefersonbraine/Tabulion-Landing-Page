import { Component } from '@angular/core';
import { HeroSection } from './sections/hero-section/hero-section';
import { FooterSection } from './sections/footer-section/footer-section';
import { ProblemSection } from './sections/problem-section/problem-section';

@Component({
  selector: 'app-landing',
  imports: [HeroSection, ProblemSection, FooterSection],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {}
