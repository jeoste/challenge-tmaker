
import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ niche: string }> } // In Next.js 15 params is a Promise
) {
    const { searchParams } = new URL(request.url);
    const pain = searchParams.get('pain') || 'Opportunity';
    const score = parseInt(searchParams.get('score') || '0', 10);
    const { niche } = await params;

    // Truncate pain if too long
    const displayPain = pain.length > 80 ? pain.substring(0, 80) + '...' : pain;

    return new ImageResponse(
        (
            <div
                style={{
                    background: '#000000', // Canvas pur
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '60px',
                    fontFamily: 'monospace',
                    position: 'relative',
                }}
            >
                {/* Top Badge */}
                <div
                    style={{
                        position: 'absolute',
                        top: '40px',
                        left: '60px',
                        fontSize: '24px',
                        color: '#FF4500',
                        display: 'flex',
                    }}
                >
                    🔥 TOP OPPORTUNITY IN {niche.toUpperCase()}
                </div>

                {/* Main Title */}
                <div
                    style={{
                        fontSize: '56px',
                        color: '#E5E5E5',
                        marginBottom: '30px',
                        textAlign: 'center',
                        maxWidth: '900px',
                        fontWeight: 'bold',
                        display: 'flex',
                    }}
                >
                    {displayPain}
                </div>

                {/* Score Badge */}
                <div
                    style={{
                        fontSize: '96px',
                        color: score >= 80 ? '#00FF41' : score >= 50 ? '#F59E0B' : '#6B7280',
                        fontWeight: 'bold',
                        marginBottom: '40px',
                        display: 'flex',
                    }}
                >
                    Gold Score: {score}/100
                </div>

                {/* Bottom Right Attribution */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '40px',
                        right: '60px',
                        fontSize: '18px',
                        color: '#6B7280',
                        display: 'flex',
                    }}
                >
                    Analyzed by Reddit Goldmine AI
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );
}
