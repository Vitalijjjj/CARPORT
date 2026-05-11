import { Link } from 'react-router-dom'
import { useLang } from './lang/LangContext'

const IG_URL = 'https://www.instagram.com/turboeagle.lda?igsh=MTRxd3l0bjNudDF4Yg%3D%3D'
const FB_URL = 'https://www.facebook.com/share/1D3kQ3XXpu/?mibextid=wwXIfr'
const WA_URL = 'https://wa.me/351000000000'

export default function Footer({ onCta }) {
  const { t } = useLang()
  return (
    <footer className="footer" id="contact">
      <div className="footer-inner">
        <div className="footer-top">

          <div className="footer-brand">
            <div className="footer-brand-name">TURBOEAGLE</div>
            <p className="footer-brand-desc">{t.footer.desc}</p>
            <div className="footer-socials">
              <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="footer-social footer-social-wa" aria-label="WhatsApp">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.523 5.847L.057 23.882a.5.5 0 0 0 .611.61l6.101-1.456A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.667-.498-5.2-1.37l-.373-.214-3.868.924.944-3.786-.234-.389A9.953 9.953 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              </a>
              <a href={IG_URL} target="_blank" rel="noopener noreferrer" className="footer-social footer-social-ig" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
              </a>
              <a href={FB_URL} target="_blank" rel="noopener noreferrer" className="footer-social footer-social-fb" aria-label="Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
            </div>
            <button className="btn btn-invert footer-brand-cta" onClick={onCta}>
              {t.footer.getOffer}
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 5 7 7-7 7"/></svg>
            </button>
          </div>

          <div className="footer-info">
            <div className="footer-row">
              <div className="footer-col">
                <span className="footer-col-label">{t.footer.navLabel}</span>
                <Link to="/">{t.footer.home}</Link>
                <Link to="/#models">{t.footer.cars}</Link>
                <Link to="/#import">{t.footer.importGermany}</Link>
                <Link to="/#quiz">{t.footer.financingLink}</Link>
                <Link to="/#reviews">{t.footer.reviewsLink}</Link>
                <Link to="/#location">{t.footer.locationLink}</Link>
                <Link to="/#faq">FAQ</Link>
              </div>
              <div className="footer-col">
                <span className="footer-col-label">{t.footer.servicesLabel}</span>
                <Link to="/#models">{t.footer.availableCars}</Link>
                <Link to="/#import">{t.footer.customImport}</Link>
                <Link to="/#financing">{t.footer.financing}</Link>
                <Link to="/#quiz">{t.footer.tradeIn}</Link>
                <Link to="/#models">{t.footer.warrantySupport}</Link>
                <Link to="/#location">{t.footer.portugalDelivery}</Link>
              </div>
              <div className="footer-col">
                <span className="footer-col-label">{t.footer.contactLabel}</span>
                <a href="tel:+351000000000">+351 000 000 000</a>
                <a href="mailto:info@turboeagle.pt">info@turboeagle.pt</a>
                <a href={WA_URL} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                <a href={IG_URL} target="_blank" rel="noopener noreferrer">Instagram</a>
                <a href={FB_URL} target="_blank" rel="noopener noreferrer">Facebook</a>
                <span>Portugal</span>
              </div>
            </div>

            <div className="footer-meta">
              <div className="footer-bottom-left">
                <span>{t.footer.copyright}</span>
              </div>
              <div className="footer-bottom-right">
                <a href="#">{t.footer.privacy}</a>
                <a href="#">{t.footer.terms}</a>
                <a href="#">{t.footer.cookies}</a>
              </div>
            </div>
          </div>

        </div>
        <div className="footer-logo">
          <div className="word">TURBOEAGLE</div>
        </div>
      </div>
    </footer>
  )
}
