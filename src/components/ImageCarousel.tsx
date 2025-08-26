import { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ListingImage } from "@/types/listings";

interface ImageCarouselProps {
	images: ListingImage[];
}

export default function ImageCarousel({ images }: ImageCarouselProps) {
	const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

	const scrollPrev = useCallback(() => {
		if (emblaApi) emblaApi.scrollPrev();
	}, [emblaApi]);

	const scrollNext = useCallback(() => {
		if (emblaApi) emblaApi.scrollNext();
	}, [emblaApi]);

	if (!images.length) {
		return (
			<div className="w-full h-64 bg-gray-200 flex items-center justify-center">
				<p className="text-gray-500">No images available</p>
			</div>
		);
	}

	return (
		<div className="relative overflow-hidden">
			<div className="overflow-hidden" ref={emblaRef}>
				<div className="flex">
					{images.map((image) => (
						<div key={image.Id} className="relative min-w-full flex-shrink-0">
							<div className="h-64 w-full relative">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={image.displayImageURL || image.Image_URL}
									alt={image.Image_Description || image.Name}
									className="absolute inset-0 w-full h-full object-cover"
								/>
							</div>
							{image.Image_Description && (
								<div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
									<p>{image.Image_Description}</p>
								</div>
							)}
						</div>
					))}
				</div>
			</div>
			
			{images.length > 1 && (
				<>
					<button
						className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 shadow-md"
						onClick={scrollPrev}
						aria-label="Previous image"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<polyline points="15 18 9 12 15 6"></polyline>
						</svg>
					</button>
					<button
						className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 shadow-md"
						onClick={scrollNext}
						aria-label="Next image"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<polyline points="9 18 15 12 9 6"></polyline>
						</svg>
					</button>
				</>
			)}
		</div>
	);
}
