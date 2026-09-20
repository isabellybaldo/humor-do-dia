import './globals.css';

export const metadata = { title: 'Humor do Dia', description: 'O humor do dia da turma.' };

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" data-theme="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme')||'dark';document.documentElement.setAttribute('data-theme',t);})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
