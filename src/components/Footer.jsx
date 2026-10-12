import { memo } from 'react';
import { SUPPORT_URL } from '../config.js';
import { CoffeeIcon } from './Icons.jsx';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <a className="footer__link" href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">
        <CoffeeIcon width={14} height={14} />
        <span>Support this project</span>
      </a>
    </footer>
  );
}

export default memo(Footer);
