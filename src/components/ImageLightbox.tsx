"use client";
import { useEffect, useRef } from "react";
import { ListingImage } from "@/types/listings";

interface ImageLightboxProps {
	images: ListingImage[];
	initialIndex?: number;
	onClose: () => void;
}

export default function ImageLightbox({ images, initialIndex = 0, onClose }: ImageLightboxProps) {
	const overlayRef = useRef<HTMLDivElement | null>(null);
	const initialImageRef = useRef<HTMLDivElement | null>(null);
	const galleryRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};
		window.addEventListener("keydown", onKeyDown);

		// lock body scroll while lightbox is open
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		return () => {
			window.removeEventListener("keydown", onKeyDown);
			document.body.style.overflow = prevOverflow;
		};
	}, [onClose]);

	const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (e.target === overlayRef.current) {
			onClose();
		}
	};

	return (
		<div
			ref={overlayRef}
			className="fixed inset-0 z-50 bg-black/90 flex justify-center items-start overflow-y-auto p-8"
			role="dialog"
			aria-modal="true"
			aria-label="image gallery"
			onClick={handleOverlayClick}
		>
			<button
				className="fixed top-6 right-6 bg-white text-gray-900 rounded-full h-10 w-10 flex items-center justify-center shadow cursor-pointer"
				onClick={onClose}
				aria-label="close gallery"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
					<line x1="18" y1="6" x2="6" y2="18"></line>
					<line x1="6" y1="6" x2="18" y2="18"></line>
				</svg>
			</button>
			<div ref={galleryRef} className="@container relative w-full max-w-3xl lightbox-gallery">
				{images.map((img: ListingImage, idx) => (
					<div
						key={img.Id}
						ref={idx === initialIndex ? initialImageRef : null}
						className="mb-6 flex flex-col items-center"
					>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={img.displayImageURL || img.Image_URL}
							alt={img.Image_Description || img.Name}
							className="w-full h-auto max-h-[100cqw] object-contain"
						/>
						{((img.Image_Description || img.Name)) && (
							<p className="mt-2 text-gray-200 text-sm text-center">{img.Image_Description || img.Name}</p>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
