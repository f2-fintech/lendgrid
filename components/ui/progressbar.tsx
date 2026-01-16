'use client'
import * as React from "react"
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'

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
	trackClass = 'bg-muted',
	fillClass = 'bg-yellow-400',
	showLabel = false,
	ariaLabel = 'Progress',
}: ProgressBarProps) {
	const pct = Math.max(0, Math.min(100, Math.round(value || 0)))
	const isComplete = pct === 100

	return (
		<div className={`w-full ${className}`} role="progressbar" aria-label={ariaLabel} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
			<div className={`${isComplete ? 'rounded-full' : 'rounded'} ${heightClass} overflow-hidden ${trackClass}`}>
				<motion.div
					className={`${isComplete ? 'bg-gradient-to-r from-green-500 to-emerald-500' : fillClass} h-full ${isComplete ? 'rounded-full' : 'rounded'}`}
					style={{ width: `${pct}%` }}
					animate={{ width: `${pct}%` }}
					transition={{ duration: 0.6, ease: 'easeInOut' }}
				/>
			</div>
			{showLabel && (
				<div className="mt-1 text-sm text-foreground">{pct}%</div>
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
	title,
	description,
	actionLabel = 'Complete Profile',
	onAction,
	showAction = true,
}: CompletionBannerProps) {
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
	const isComplete = percent === 100

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

	// Dynamic content based on completion
	const displayTitle = isComplete
		? (title || '✨ Profile Complete!')
		: (title || 'Profile Incomplete')

	const displayDesc = isComplete
		? (description || 'Congratulations! Your profile is fully set up. You can now access all features and submit loan applications.')
		: (description || `Your aggregator profile is ${percent}% complete. Complete your profile to enable payouts and verification.`)

	// Dynamic colors
	const borderColor = isComplete ? 'border-green-600' : 'border-yellow-700'
	const bgColor = isComplete ? 'bg-green-900/10' : 'bg-yellow-900/10'
	const textColor = isComplete ? 'text-green-300' : 'text-yellow-300'
	const textColorSecondary = isComplete ? 'text-green-100' : 'text-foreground'
	const buttonBorder = isComplete ? 'border-green-600' : 'border-yellow-600'
	const buttonText = isComplete ? 'text-green-400' : 'text-yellow-400'
	const glowColor = isComplete ? 'rgba(34,197,94,0.10)' : 'rgba(250,204,21,0.10)'
	const glowColorAlt = isComplete ? 'rgba(16,185,129,0.06)' : 'rgba(59,130,246,0.06)'
	const leftBarColor = isComplete ? 'bg-green-400' : 'bg-yellow-400'

	return (
		<Card className={`${bgColor} ${borderColor} relative overflow-hidden ${isComplete ? 'rounded-2xl' : ''}`}>
			<CardContent className="relative flex items-center justify-between gap-4">
				{/* Animated background glow */}
				<motion.div
					className="absolute inset-0 pointer-events-none"
					initial={{ opacity: 0.04 }}
					animate={prefersReducedMotion ? { opacity: 0.08 } : { opacity: [0.08, 0.36, 0.04] }}
					transition={{ duration: isComplete ? 1.5 : 1.8, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' }}
					style={{ background: `linear-gradient(90deg, ${glowColor}, ${glowColorAlt})` }}
				/>

				{/* Shimmer effect */}
				<motion.div
					className="absolute inset-y-0 left-0 w-1/2 pointer-events-none rounded-tr-full rounded-br-full"
					initial={{ x: '-120%', opacity: 0 }}
					animate={
						prefersReducedMotion
							? { x: '-120%', opacity: 0 }
							: { x: ['-120%', '120%'], opacity: [0, 0.6, 0] }
					}
					transition={{
						duration: isComplete ? 1.5 : 2,
						repeat: Infinity,
						repeatType: 'loop',
						ease: 'easeInOut',
						times: [0, 0.5, 1]
					}}
					style={{
						background: 'linear-gradient(90deg, rgba(255,255,255,0.10), rgba(255,255,255,0.10))',
						mixBlendMode: 'screen',
						filter: 'blur(1px)'
					}}
				/>

				{/* Left accent bar */}
				<motion.div
					className={`absolute left-0 top-0 h-full w-0.5 pointer-events-none ${leftBarColor}`}
					initial={{ opacity: 0.3 }}
					animate={prefersReducedMotion ? { opacity: 0.3 } : { opacity: [0.3, 0.9, 0.3] }}
					transition={{ duration: isComplete ? 1.5 : 1.8, repeat: Infinity, ease: 'easeInOut' }}
				/>

				{/* Sparkles for 100% completion */}
				{isComplete && !prefersReducedMotion && (
					<>
						<motion.div
							className="absolute top-4 right-20 text-green-400"
							initial={{ opacity: 0, scale: 0 }}
							animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], rotate: [0, 180, 360] }}
							transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
						>
							<Sparkles className="w-4 h-4" />
						</motion.div>
						<motion.div
							className="absolute bottom-4 right-32 text-emerald-400"
							initial={{ opacity: 0, scale: 0 }}
							animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], rotate: [0, -180, -360] }}
							transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5 }}
						>
							<Sparkles className="w-3 h-3" />
						</motion.div>
					</>
				)}

				<div className="flex-1">
					<div className="flex items-center gap-2">
						<p className={`${textColor} font-semibold`}>{displayTitle}</p>
						{isComplete && (
							<motion.div
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{ type: 'spring', duration: 0.5 }}
							>
								<CheckCircle2 className="w-5 h-5 text-green-400" />
							</motion.div>
						)}
					</div>
					<p className={`${textColorSecondary} mt-1`}>{displayDesc}</p>

					<div className="mt-3">
						<ProgressBar value={percent} showLabel={false} />
						<div className="flex items-center justify-between mt-2">
							<span className="text-sm text-muted-foreground">{percent}% Complete</span>
							{isComplete && (
								<motion.span
									className="text-sm text-green-400 font-semibold"
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.3 }}
								>
									All set! 🎉
								</motion.span>
							)}
						</div>
					</div>
				</div>

				{showAction && !isComplete && (
					<Button className={`${buttonBorder} bg-transparent ${buttonText} mt-3`} onClick={onAction}>
						{actionLabel}
						<ArrowRight className="w-4 h-4 ml-2" />
					</Button>
				)}

				{showAction && isComplete && (
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: 0.2 }}
					>
						<Button
							className="bg-gradient-to-r from-green-500 to-emerald-500 text-foreground hover:from-green-600 hover:to-emerald-600 mt-3"
							onClick={onAction}
						>
							View Dashboard
							<ArrowRight className="w-4 h-4 ml-2" />
						</Button>
					</motion.div>
				)}
			</CardContent>
		</Card>
	)
}
