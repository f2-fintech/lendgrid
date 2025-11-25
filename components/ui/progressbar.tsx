'use client'
import * as React from "react"
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
type ProgressBarProps = {
	value: number
	className?: string
	heightClass?: string
	trackClass?: string
	fillClass?: string
	showLabel?: boolean
	ariaLabel?: string
}

export function ProgressBar({
	value,
	className = '',
	heightClass = 'h-2',
	trackClass = 'bg-gray-700',
	fillClass = 'bg-yellow-400',
	showLabel = false,
	ariaLabel = 'Progress',
}: ProgressBarProps) {
	const pct = Math.max(0, Math.min(100, Math.round(value || 0)))

	return (
		<div className={`w-full ${className}`} role="progressbar" aria-label={ariaLabel} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
			<div className={`rounded ${heightClass} overflow-hidden ${trackClass}`}>
				<div
					className={`${fillClass} h-full rounded`}
					style={{ width: `${pct}%`, transition: 'width 400ms ease' }}
				/>
			</div>
			{showLabel && (
				<div className="mt-1 text-sm text-gray-300">{pct}%</div>
			)}
		</div>
	)
}

type CompletionBannerProps = {
	percent: number
	title?: string
	description?: string
	actionLabel?: string
	onAction?: () => void
	showAction?: boolean
}

export function ProfileCompletionBanner({
	percent,
	title = 'Profile Incomplete',
	description,
	actionLabel = 'Complete Profile',
	onAction,
	showAction = true,
}: CompletionBannerProps) {
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

	useEffect(() => {
		if (typeof window !== 'undefined' && window.matchMedia) {
			const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
			setPrefersReducedMotion(mq.matches)
			const handler = (e: any) => setPrefersReducedMotion(e.matches)
			if (mq.addEventListener) mq.addEventListener('change', handler)
			else mq.addListener(handler)
			return () => {
				if (mq.removeEventListener) mq.removeEventListener('change', handler)
				else mq.removeListener(handler)
			}
		}
	}, [])

	const desc = description ?? `Your aggregator profile is ${percent}% complete. Complete your profile to enable payouts and verification.`

	return (
		<Card className="bg-yellow-900/10 border-yellow-700 relative overflow-hidden">
			<CardContent className="relative flex items-center justify-between gap-4">
				<motion.div
					className="absolute inset-0 pointer-events-none"
					initial={{ opacity: 0.04 }}
					animate={prefersReducedMotion ? { opacity: 0.08 } : { opacity: [0.08, 0.36, 0.04] }}
					transition={{ duration: 1.8, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' }}
					style={{ background: 'linear-gradient(90deg, rgba(250,204,21,0.10), rgba(59,130,246,0.06))' }}
				/>

				<motion.div
					className="absolute inset-y-0 left-0 w-1/2 pointer-events-none rounded-tr-full rounded-br-full"
					initial={{ x: '-120%', opacity: 0 }}
					animate={
						prefersReducedMotion
							? { x: '-120%', opacity: 0 }
							: { x: ['-120%', '120%'], opacity: [0, 0.6, 0] }
					}
					transition={{ duration: 2, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut', times: [0, 0.5, 1] }}
					style={{
						background: 'linear-gradient(90deg, rgba(255,255,255,0.10), rgba(255,255,255,0.10))',
						mixBlendMode: 'screen',
						filter: 'blur(1px)'
					}}
				/>

				<motion.div
					className="absolute left-0 top-0 h-full w-0.5 pointer-events-none bg-yellow-400"
					initial={{ opacity: 0.3 }}
					animate={prefersReducedMotion ? { opacity: 0.3 } : { opacity: [0.3, 0.9, 0.3] }}
					transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
				/>

				<div className="flex-1">
					<p className="text-yellow-300 font-semibold">{title}</p>
					<p className="text-gray-300 mt-1">{desc}</p>

					<div className="mt-3">
						<ProgressBar value={percent} showLabel={false} />
					</div>
				</div>

				{showAction && (
					<Button className="border-yellow-600 bg-transparent text-yellow-400 mt-3" onClick={onAction}>
						{actionLabel}
						<p className="text-sm text-yellow-400 mt-1 flex items-center">
							<ArrowRight className="w-4 h-4 mr-1" />
						</p>
					</Button>
				)}
			</CardContent>
		</Card>
	)
}