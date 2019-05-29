import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { get, set } from 'lodash-es';
import { EMPTY, Observable, Observer } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NgxScriptLoaderService {
  private document: Document;
  private head: HTMLHeadElement;
  private alreadyLoaded = new Set<string>();

  constructor(@Inject(DOCUMENT) document: Document) {
    this.document = document;
    this.head = this.document.head;
    this.checkAlreadyLoadedScripts();
    this.checkAlreadyLoadedStyles();
  }

  private static observeLoad(element: HTMLElement): Observable<UIEvent> {
    return new Observable((observer: Observer<UIEvent>) => {
      const successHandler = (event: UIEvent) => {
        const readyState: string = get(element, ['readyState'], '');
        // For IE we have readyState, other browsers just call the load event and we proccede
        if (readyState === 'complete' || readyState === 'loaded' || event.type === 'load') {
          observer.next(event);
          observer.complete();
        }
      };
      const errorHandler = (event: UIEvent) => observer.error(event);
      set(element, ['onreadystatechange'], successHandler);
      set(element, ['onload'], get(element, ['onreadystatechange'], successHandler));
      set(element, ['onerror'], errorHandler);
    });
  }

  private static createScriptElement(src: string, integrity?: string): HTMLScriptElement {
    const script = document.createElement('script');
    if (integrity !== 'undefined') {
      script.integrity = integrity;
      script.crossOrigin = 'anonymous';
    }
    script.src = src;
    return script;
  }

  // tslint:disable-next-line:naming-convention
  private static createCSSElement(href: string): HTMLLinkElement {
    const style = document.createElement('link');

    style.rel = 'stylesheet';
    style.type = 'text/css';
    style.href = href;

    return style;
  }

  /**
   * Dynamically loads the given script
   * @param src The url of the script to load dynamically
   * @param integrity set integrity check value
   * @returns Observable<UIEvent> Observable that will be resolved once the script has been loaded.
   */
  public loadScript(src: string, integrity?: string): Observable<UIEvent> {
    if (this.alreadyLoaded.has(src)) {
      return EMPTY;
    } else {
      const script = NgxScriptLoaderService.createScriptElement(src, integrity);
      const observable = NgxScriptLoaderService.observeLoad(script);
      this.head.appendChild(script);
      this.alreadyLoaded.add(src);
      return observable;
    }
  }

  /**
   * Dynamically loads the given CSS file
   * @param href The url of the CSS to load dynamically
   * @returns Observable<UIEvent> Promise that will be resolved once the CSS file has been loaded.
   */
  public loadCSS(href: string): Observable<UIEvent> {
    // tslint:disable-line:naming-convention
    if (this.alreadyLoaded.has(href)) {
      return EMPTY;
    } else {
      const style = NgxScriptLoaderService.createCSSElement(href);
      const observable = NgxScriptLoaderService.observeLoad(style);
      this.head.appendChild(style);
      this.alreadyLoaded.add(href);
      return observable;
    }
  }

  /**
   * Dynamically unloads the given CSS file
   * @param href The url of the CSS to unload dynamically
   * @returns boolean that will be true once the CSS file has been unloaded successfully or otherwise false.
   */
  public unloadCSS(href: string): boolean {
    // tslint:disable-line:naming-convention
    if (typeof this.head !== 'undefined') {
      const targetCss = this.head.querySelector(`[href="${href}"]`);
      if (typeof targetCss !== 'undefined') {
        targetCss.remove();
        this.alreadyLoaded.delete(href);
        return true;
      }
    }
    return false;
  }

  public hasLoadedSimilar(url: string) {
    return Array.from(this.alreadyLoaded.values()).some((value) => value.startsWith(url));
  }

  private checkAlreadyLoadedScripts() {
    const scripts = this.head.getElementsByTagName('script');
    Array.from(scripts)
      .filter((script) => typeof script.src !== 'undefined')
      .forEach((script) => {
        this.alreadyLoaded.add(script.src);
      });
  }

  private checkAlreadyLoadedStyles() {
    const styles = this.head.getElementsByTagName('link');
    Array.from(styles)
      .filter((style) => style.rel === 'stylesheet' && style.type === 'text/css' && typeof style.href !== 'undefined')
      .forEach((style) => {
        this.alreadyLoaded.add(style.href);
      });
  }
}
