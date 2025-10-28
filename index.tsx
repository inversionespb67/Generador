import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

interface LinkedinText {
    headline: string;
    body: string;
    hashtags: string;
}
interface TwitterText {
    hook: string;
    body: string;
    hashtags: string;
}
interface InstagramText {
    hook: string;
    caption: string;
    hashtags: string;
}

interface SocialPost<T> {
    text: T;
    imageUrl: string;
}

interface AppState {
    linkedin: SocialPost<LinkedinText> | null;
    twitter: SocialPost<TwitterText> | null;
    instagram: SocialPost<InstagramText> | null;
}

const App: React.FC = () => {
    const [idea, setIdea] = useState('');
    const [tone, setTone] = useState('Profesional');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [content, setContent] = useState<AppState>({
        linkedin: null,
        twitter: null,
        instagram: null,
    });

    const handleGenerate = async () => {
        if (!idea.trim()) {
            setError("Por favor, introduce una idea.");
            return;
        }

        setLoading(true);
        setError(null);
        setContent({ linkedin: null, twitter: null, instagram: null });

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const imagePromptResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Genera un prompt para un modelo de IA de texto-a-imagen. El prompt DEBE estar exclusivamente en español y no contener ninguna palabra en inglés. Debe describir una escena visualmente rica, artística y evocadora basada en la idea: "${idea}". El prompt debe ser una sola frase descriptiva. Ejemplo: 'Un cerebro cibernético brillante con circuitos de luz de neón sobre un fondo de código binario oscuro, concepto de inteligencia artificial.'`,
            });
            const imagePrompt = imagePromptResponse.text;

            const textPrompt = `Actúa como un "Genio Creativo y Gurú de Redes Sociales", un experto en crear contenido que no solo informa, sino que cautiva y se vuelve viral. Tu misión es transformar la idea "${idea}" con un tono "${tone}" en tres obras maestras de contenido en español, una para cada plataforma, listas para publicar.

**Tu Estilo:** Eres visual, emocional y estratégico. Usas emojis no como decoración, sino como herramientas de comunicación para guiar la vista, enfatizar puntos y añadir personalidad. El formato es CLAVE.

Responde ÚNICAMENTE en formato JSON, adhiriéndote estrictamente al siguiente esquema:

Para LinkedIn (El Profesional Carismático):
- "headline": Un titular magnético que despierte curiosidad profesional.
- "body": Escribe con párrafos ultra-cortos (1-2 líneas). Usa emojis profesionales (ej: 🚀, 💡, 📈, ✅, 👉) para iniciar listas o resaltar logros. La estructura es vital:
    1. Gancho potente.
    2. Desarrollo del problema/solución.
    3. Lista de beneficios/puntos clave (¡usa emojis aquí!).
    4. Una pregunta final que invite a la reflexión y al debate en los comentarios.
- "hashtags": Una cadena de 3 a 5 hashtags de alto valor.

Para Twitter/X (El Comunicador Audaz):
- "hook": Una frase inicial que sea dinamita pura. ¡Impactante e imposible de ignorar!
- "body": Mensaje directo al grano. Usa 1-2 emojis que refuercen la emoción (ej: 🔥, 🤯, ⚡️). La brevedad es poder.
- "hashtags": Una cadena de 2 a 3 hashtags relevantes y con potencial de tendencia.

Para Instagram (El Storyteller Visual):
- "hook": Una primera línea que sea un imán para los ojos, empezando con una combinación de emojis que resuma la vibra del post.
- "caption": ¡Aquí cuentas una historia! Usa un lenguaje más personal y cercano.
    - Estructura el texto con muchos saltos de línea para que "respire".
    - Intercala emojis relevantes (ej: ✨, 📸, ❤️, 👇) dentro de las frases para hacer el texto escaneable y visualmente atractivo.
    - Termina con una llamada a la acción clara, invitando a comentar, guardar o compartir.
- "hashtags": Una cadena de 5 a 15 hashtags relevantes y populares, separados por espacios.`;
            
            const textPromise = ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: textPrompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            linkedin: {
                                type: Type.OBJECT,
                                properties: {
                                    headline: { type: Type.STRING },
                                    body: { type: Type.STRING },
                                    hashtags: { type: Type.STRING }
                                },
                                required: ["headline", "body", "hashtags"]
                            },
                            twitter: {
                                type: Type.OBJECT,
                                properties: {
                                    hook: { type: Type.STRING },
                                    body: { type: Type.STRING },
                                    hashtags: { type: Type.STRING }
                                },
                                required: ["hook", "body", "hashtags"]
                            },
                            instagram: {
                                type: Type.OBJECT,
                                properties: {
                                    hook: { type: Type.STRING },
                                    caption: { type: Type.STRING },
                                    hashtags: { type: Type.STRING }
                                },
                                required: ["hook", "caption", "hashtags"]
                            },
                        },
                        required: ["linkedin", "twitter", "instagram"],
                    },
                },
            });

            const generateImage = (aspectRatio: '16:9' | '4:3' | '1:1') => {
                 return ai.models.generateImages({
                    model: 'imagen-4.0-generate-001',
                    prompt: imagePrompt,
                    config: {
                        numberOfImages: 1,
                        outputMimeType: 'image/jpeg',
                        aspectRatio,
                    },
                });
            }

            const linkedinImagePromise = generateImage('4:3');
            const twitterImagePromise = generateImage('16:9');
            const instagramImagePromise = generateImage('1:1');

            const [
                textResponse,
                linkedinImageResponse,
                twitterImageResponse,
                instagramImageResponse
            ] = await Promise.all([
                textPromise,
                linkedinImagePromise,
                twitterImagePromise,
                instagramImagePromise
            ]);

            const textResult = JSON.parse(textResponse.text);

            setContent({
                linkedin: {
                    text: textResult.linkedin,
                    imageUrl: `data:image/jpeg;base64,${linkedinImageResponse.generatedImages[0].image.imageBytes}`,
                },
                twitter: {
                    text: textResult.twitter,
                    imageUrl: `data:image/jpeg;base64,${twitterImageResponse.generatedImages[0].image.imageBytes}`,
                },
                instagram: {
                    text: textResult.instagram,
                    imageUrl: `data:image/jpeg;base64,${instagramImageResponse.generatedImages[0].image.imageBytes}`,
                },
            });

        } catch (err) {
            console.error(err);
            setError("Ocurrió un error al generar el contenido. Por favor, inténtalo de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <h1>Generador de Contenido para Redes Sociales</h1>

            <div className="form-container">
                <div className="input-group">
                    <label htmlFor="idea">Tu Idea</label>
                    <textarea
                        id="idea"
                        value={idea}
                        onChange={(e) => setIdea(e.target.value)}
                        placeholder="Ej: Lanzamiento de una nueva app de fitness que usa IA para crear planes de entrenamiento personalizados."
                        rows={4}
                        disabled={loading}
                    />
                </div>
                <div className="input-group">
                    <label htmlFor="tone">Tono</label>
                    <select
                        id="tone"
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        disabled={loading}
                    >
                        <option>Profesional</option>
                        <option>Ingenioso</option>
                        <option>Urgente</option>
                        <option>Inspirador</option>
                        <option>Casual</option>
                    </select>
                </div>
                <button onClick={handleGenerate} disabled={loading || !idea}>
                    {loading ? 'Generando...' : 'Generar Contenido'}
                </button>
            </div>

            {loading && <div className="loader">Generando... Esto puede tardar un momento. ✨</div>}
            {error && <div className="error">{error}</div>}

            {(content.linkedin || content.twitter || content.instagram) && (
                 <div className="results-grid">
                    {content.linkedin && (
                        <Card platform="LinkedIn" content={content.linkedin} aspectRatio="4:3" />
                    )}
                    {content.twitter && (
                        <Card platform="Twitter / X" content={content.twitter} aspectRatio="16:9" />
                    )}
                    {content.instagram && (
                        <Card platform="Instagram" content={content.instagram} aspectRatio="1:1" />
                    )}
                 </div>
            )}
        </div>
    );
};

interface CardProps {
    platform: string;
    content: SocialPost<any>;
    aspectRatio: '16:9' | '4:3' | '1:1';
}

const Card: React.FC<CardProps> = ({ platform, content, aspectRatio }) => {
    const [prepared, setPrepared] = useState(false);

    const getFormattedText = () => {
        const { text } = content;
        switch (platform) {
            case 'LinkedIn':
                return `${text.headline}\n\n${text.body}\n\n${text.hashtags}`;
            case 'Twitter / X':
                return `${text.hook}\n\n${text.body}\n\n${text.hashtags}`;
            case 'Instagram':
                return `${text.hook}\n\n${text.caption}\n\n.\n.\n.\n\n${text.hashtags}`;
            default:
                return '';
        }
    };

    const getPublishUrl = () => {
        switch (platform) {
            case 'LinkedIn':
                return 'https://www.linkedin.com/post/new/';
            case 'Twitter / X':
                const text = encodeURIComponent(`${content.text.hook}\n\n${content.text.body}\n\n${content.text.hashtags}`);
                return `https://twitter.com/intent/tweet?text=${text}`;
            case 'Instagram':
                return 'https://www.instagram.com/create/select/';
            default:
                return '#';
        }
    };

    const handlePrepare = async () => {
        if (prepared) return;
        try {
            // 1. Copy text to clipboard
            await navigator.clipboard.writeText(getFormattedText());

            // 2. Download image
            const link = document.createElement('a');
            link.href = content.imageUrl;
            const safePlatform = platform.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            link.download = `${safePlatform}_image.jpeg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // 3. Update state
            setPrepared(true);
            setTimeout(() => setPrepared(false), 4000); // Reset after 4 seconds
        } catch (err) {
            console.error('Failed to prepare content: ', err);
            alert('Error al preparar el contenido. Revisa la consola para más detalles.');
        }
    };

    return (
        <article className="card" aria-labelledby={`${platform}-header`}>
            <header className="card-header" id={`${platform}-header`}>{platform}</header>
            <div 
                className="card-image"
                style={{ backgroundImage: `url(${content.imageUrl})` }}
                role="img"
                aria-label={`Imagen generada para ${platform}`}
                data-aspect-ratio={aspectRatio}
            ></div>
            <div className="card-content">
                {content.text.headline && <h4>{content.text.headline}</h4>}
                {content.text.hook && <p><strong>{content.text.hook}</strong></p>}
                {content.text.body && <p>{content.text.body}</p>}
                {content.text.caption && <p>{content.text.caption}</p>}
                {content.text.hashtags && <p className="hashtags">{content.text.hashtags}</p>}
            </div>
            <div className="card-footer">
                <button onClick={handlePrepare} className={`prepare-button ${prepared ? 'prepared' : ''}`} disabled={prepared}>
                    {prepared ? '✅ ¡Texto Copiado e Imagen Descargada!' : 'Preparar Contenido'}
                </button>
                <a 
                    href={getPublishUrl()} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="publish-button"
                    aria-label={`Publicar en ${platform}`}
                >
                    Publicar en {platform.split(' ')[0]}
                </a>
            </div>
        </article>
    );
};


const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);