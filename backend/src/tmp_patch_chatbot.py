from pathlib import Path
path = Path('src/services/chatbot-service.js')
text = path.read_text('utf8')
old = "        if (sess.pagamento === 'PIX') resp += `🟩 *Pagamento via PIX*\nChave CPF: `00482817518`\nEnvie o comprovante aqui após pagar. 🙏`;\n        else if (sess.pagamento === 'CARTAO') resp += `💳 Nosso entregador levará a maquininha!`;\n"
new = "        if (sess.pagamento === 'PIX') {\n          const settings = await getSettings();\n          const pixKey = settings.companyProfile?.documento || '00482817518';\n          resp += `🟩 *Pagamento via PIX*\nChave: ${pixKey}\nEnvie o comprovante aqui após pagar. 🙏`;\n        } else if (sess.pagamento === 'CARTAO') resp += `💳 Nosso entregador levará a maquininha!`;\n"
if old not in text:
    raise SystemExit('old string not found')
text = text.replace(old, new, 1)
path.write_text(text, 'utf8')
print('patched')
