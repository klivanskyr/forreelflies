'use client';

import React, { useState, useRef, Dispatch, SetStateAction, useEffect } from "react";
import Button from "../buttons/Button";
import Checkbox from "../Checkbox";
import Dropdown from "../inputs/Dropdown";
import Input from "../inputs/Input";
import TagInput from "../inputs/TagInput";
import NumberTagInput from "../inputs/NumberTagInput";
import Modal from "../modal/Modal";
import Textarea from "../Textarea";
import FormFieldTooltip from "../inputs/FormFieldTooltip";
import { StockStatus } from "@/app/types/types";
import { uploadFileAndGetUrl, testFirebaseStorageConnection } from "@/lib/firebase";
import { toast } from "sonner";
import { FaCamera, FaUpload, FaTrash, FaInfoCircle, FaLightbulb } from "react-icons/fa";
import { ref, uploadBytes, getStorage } from "firebase/storage";

export interface ProductInput {
    name: string;
    shortDescription: string;
    longDescription: string;
    price: string;
    originalPrice: string;
    discountPercentage: string;
    stockStatus: string;
    stockQuantity: string;
    lowStockThreshold: string;
    trackQuantity: boolean;
    quantityOptions: number[];
    tags: string[];
    catagories: string[];
    isDraft: boolean;
    images: File[];
    shippingWeight: string;
    shippingLength: string;
    shippingWidth: string;
    shippingHeight: string;
}

interface Props {
    handleSubmit: (imageUrls: string[]) => Promise<void>;
    isSubmitting: boolean;
    input: ProductInput;
    setInput: Dispatch<SetStateAction<ProductInput>>;
    modalOpen: boolean;
    setModalOpen: Dispatch<SetStateAction<boolean>>;
    vendorId: string;
    tourStep?: number;
}

export default function StoreManagerProductModal({
    handleSubmit,
    isSubmitting,
    input,
    setInput,
    modalOpen,
    setModalOpen,
    vendorId,
    tourStep
}: Props) {    
    const stockStatusOptions = [
        { value: "inStock", label: "In Stock" },
        { value: "outOfStock", label: "Out of Stock" },
        { value: "unknown", label: "Unknown" }
    ];

    const [uploading, setUploading] = useState(false);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<"basic" | "inventory">("basic");
    const [uploadAbortController, setUploadAbortController] = useState<AbortController | null>(null);

    // Refs for form fields
    const nameRef = useRef<HTMLInputElement>(null);
    const priceRef = useRef<HTMLInputElement>(null);
    const quantityOptionsRef = useRef<HTMLInputElement>(null);
    const shippingLengthRef = useRef<HTMLInputElement>(null);
    const shippingWidthRef = useRef<HTMLInputElement>(null);
    const shippingHeightRef = useRef<HTMLInputElement>(null);
    const shippingWeightRef = useRef<HTMLInputElement>(null);

    // File validation constants
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_FILES = 10;
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];



    // Preview selected images
    React.useEffect(() => {
        if (input.images && input.images.length > 0) {
            const urls = input.images.map((file) => URL.createObjectURL(file));
            setImagePreviews(urls);
            return () => urls.forEach(url => URL.revokeObjectURL(url));
        } else {
            setImagePreviews([]);
        }
    }, [input.images]);

    // Add useEffect to handle tab switching during tour:
    useEffect(() => {
        // Auto-switch to inventory tab during tour step 6
        if (tourStep === 6) {
            setActiveTab("inventory");
        }
    }, [tourStep]);

    // Validate and handle file selection
    const handleFileSelection = (files: FileList | null) => {
        if (!files) return;

        const fileArray = Array.from(files);
        const validFiles: File[] = [];
        const errors: string[] = [];

        // Check file count
        if (fileArray.length > MAX_FILES) {
            toast.error(`Maximum ${MAX_FILES} images allowed. Please select fewer files.`);
            return;
        }

        // Validate each file
        fileArray.forEach((file, index) => {
            // Check file type
            if (!ALLOWED_TYPES.includes(file.type)) {
                errors.push(`File ${index + 1}: Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.`);
                return;
            }

            // Check file size
            if (file.size > MAX_FILE_SIZE) {
                errors.push(`File ${index + 1}: File size too large. Maximum size is 10MB.`);
                return;
            }

            // Check file name length
            if (file.name.length > 100) {
                errors.push(`File ${index + 1}: File name too long. Please rename to less than 100 characters.`);
                return;
            }

            validFiles.push(file);
        });

        // Show errors if any
        if (errors.length > 0) {
            errors.forEach(error => toast.error(error));
            if (validFiles.length === 0) return;
            toast.success(`${validFiles.length} valid images selected.`);
        }

        // Update state with valid files
        setInput({ ...input, images: validFiles });
    };

    // Remove image
    const removeImage = (idx: number) => {
        const newFiles = input.images.filter((_, i) => i !== idx);
        setInput({ ...input, images: newFiles });
        toast.success("Image removed");
    };

    // Calculate discount percentage when prices change
    const calculateDiscountPercentage = (originalPrice: string, currentPrice: string) => {
        const original = parseFloat(originalPrice);
        const current = parseFloat(currentPrice);
        if (original > 0 && current > 0 && original > current) {
            return Math.round(((original - current) / original) * 100).toString();
        }
        return "";
    };

    // Validation function
    const validateForm = () => {
        const stringtofloat = (str: string) => {
            const stripedString = str.replace(/[^0-9.]/g, "");
            const parsedFloat = parseFloat(stripedString);
            return isNaN(parsedFloat) ? 0 : parsedFloat;
        };

        const price = stringtofloat(input.price);
        const shippingHeight = stringtofloat(input.shippingHeight);
        const shippingLength = stringtofloat(input.shippingLength);
        const shippingWeight = stringtofloat(input.shippingWeight);
        const shippingWidth = stringtofloat(input.shippingWidth);

        // Check required fields in order of appearance
        if (!input.name.trim()) {
            toast.error("Product name is required");
            setActiveTab("basic");
            setTimeout(() => nameRef.current?.focus(), 100);
            return false;
        }

        if (input.name.length < 3) {
            toast.error("Product name must be at least 3 characters long");
            setActiveTab("basic");
            setTimeout(() => nameRef.current?.focus(), 100);
            return false;
        }

        if (input.images.length === 0) {
            toast.error("At least one product image is required");
            setActiveTab("basic");
            return false;
        }

        if (price <= 0) {
            toast.error("Product price must be greater than $0");
            setActiveTab("inventory");
            setTimeout(() => priceRef.current?.focus(), 100);
            return false;
        }

        if (price > 10000) {
            toast.error("Product price cannot exceed $10,000");
            setActiveTab("inventory");
            setTimeout(() => priceRef.current?.focus(), 100);
            return false;
        }

        // Validate original price if provided
        if (input.originalPrice && parseFloat(input.originalPrice) > 0) {
            const originalPrice = parseFloat(input.originalPrice);
            if (originalPrice <= price) {
                toast.error("Original price must be greater than current price for a discount");
                setActiveTab("inventory");
                setTimeout(() => priceRef.current?.focus(), 100);
                return false;
            }
        }

        if (input.quantityOptions.length === 0) {
            toast.error("At least one quantity option is required");
            setActiveTab("inventory");
            setTimeout(() => quantityOptionsRef.current?.focus(), 100);
            return false;
        }

        if (shippingLength <= 0) {
            toast.error("Shipping length must be greater than 0 inches");
            setActiveTab("inventory");
            setTimeout(() => shippingLengthRef.current?.focus(), 100);
            return false;
        }

        if (shippingWidth <= 0) {
            toast.error("Shipping width must be greater than 0 inches");
            setActiveTab("inventory");
            setTimeout(() => shippingWidthRef.current?.focus(), 100);
            return false;
        }

        if (shippingHeight <= 0) {
            toast.error("Shipping height must be greater than 0 inches");
            setActiveTab("inventory");
            setTimeout(() => shippingHeightRef.current?.focus(), 100);
            return false;
        }

        if (shippingWeight <= 0) {
            toast.error("Shipping weight must be greater than 0 pounds");
            setActiveTab("inventory");
            setTimeout(() => shippingWeightRef.current?.focus(), 100);
            return false;
        }

        // Validate reasonable shipping dimensions
        if (shippingHeight > 100 || shippingLength > 100 || shippingWidth > 100) {
            toast.error("Shipping dimensions cannot exceed 100 inches");
            setActiveTab("inventory");
            setTimeout(() => shippingLengthRef.current?.focus(), 100);
            return false;
        }

        if (shippingWeight > 150) {
            toast.error("Shipping weight cannot exceed 150 pounds");
            setActiveTab("inventory");
            setTimeout(() => shippingWeightRef.current?.focus(), 100);
            return false;
        }

        return true;
    };

    // Handle save: validate first, then upload images, get URLs, then call handleSubmit
    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setUploading(true);
            const abortController = new AbortController();
            setUploadAbortController(abortController);
            let imageUrls: string[] = [];
            
            if (input.images && input.images.length > 0) {
                // Test Firebase Storage connectivity first
                const isConnected = await testFirebaseStorageConnection();
                if (!isConnected) {
                    toast.error('Firebase Storage is not available. Please check your configuration.', { id: 'upload-toast' });
                    setUploading(false);
                    setUploadAbortController(null);
                    return;
                }

                toast.loading(`Uploading ${input.images.length} images...`, { id: 'upload-toast' });
                
                // Upload images with improved error handling and fallback
                const uploadPromises = input.images.map(async (file, index) => {
                    try {
                        // Check if upload was cancelled
                        if (abortController.signal.aborted) {
                            throw new Error('Upload cancelled');
                        }
                        
                        console.log(`Starting upload for image ${index + 1}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
                        
                        // Upload to Firebase Storage
                        const url = await uploadFileAndGetUrl(file, `products/${input.name}_${Date.now()}_${file.name}`, 3);
                        console.log(`Successfully uploaded image ${index + 1} to Firebase Storage: ${file.name}`);
                        return url;
                    } catch (uploadError) {
                        console.error(`Failed to upload image ${index + 1}:`, uploadError);
                        if (uploadError instanceof Error && uploadError.message === 'Upload cancelled') {
                            throw uploadError;
                        }
                        throw new Error(`Failed to upload "${file.name}": ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
                    }
                });

                try {
                    imageUrls = await Promise.all(uploadPromises);
                    toast.success(`Successfully uploaded ${imageUrls.length} images!`, { id: 'upload-toast' });
                } catch (uploadError) {
                    if (uploadError instanceof Error && uploadError.message === 'Upload cancelled') {
                        toast.info('Upload was cancelled', { id: 'upload-toast' });
                    } else {
                        const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error';
                        toast.error(`Image upload failed: ${errorMessage}`, { id: 'upload-toast' });
                        console.error('Upload error details:', uploadError);
                        
                        // Show specific troubleshooting tips based on error
                        setTimeout(() => {
                            let troubleshootingMessage = 'Troubleshooting: ';
                            if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
                                troubleshootingMessage += 'Please check your authentication and try logging out and back in.';
                            } else if (errorMessage.includes('quota')) {
                                troubleshootingMessage += 'Storage quota exceeded. Please contact support.';
                            } else if (errorMessage.includes('timeout')) {
                                troubleshootingMessage += 'Upload timed out. Please check your internet connection and try smaller images.';
                            } else if (errorMessage.includes('bucket not found') || errorMessage.includes('storage/unknown')) {
                                troubleshootingMessage += 'Firebase Storage is not properly configured. Images are being stored as base64 (temporary solution).';
                            } else {
                                troubleshootingMessage += 'Check internet connection, try smaller images, or contact support if the issue persists.';
                            }
                            
                            toast.error(troubleshootingMessage, { 
                                id: 'troubleshooting-toast',
                                duration: 8000 
                            });
                        }, 2000);
                    }
                    setUploading(false);
                    setUploadAbortController(null);
                    return;
                }
            }
            
            setUploading(false);
            setUploadAbortController(null);
            // Call handleSubmit with imageUrls
            handleSubmit(imageUrls);
        } catch (error) {
            console.error("Error in handleSave:", error);
            toast.error("Failed to process product data. Please try again.");
            setUploading(false);
            setUploadAbortController(null);
        }
    };

    const TabButton = ({ tab, label }: { tab: typeof activeTab, label: string }) => (
        <button
            type="button"
            onClick={() => setActiveTab(tab)}
            data-tour={tab === "inventory" ? "inventory-tab" : undefined} // Add this
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab 
                    ? 'bg-greenPrimary text-white border-b-2 border-greenPrimary' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
            {label}
        </button>
    );

    const isProcessing = uploading || isSubmitting;

    // Calculate form completion percentage
    const calculateCompletion = () => {
        const requiredFields = [
            input.name,
            input.price,
            input.shippingLength,
            input.shippingWidth,
            input.shippingHeight,
            input.shippingWeight,
            input.quantityOptions.length > 0,
            input.images.length > 0
        ];
        
        const completedFields = requiredFields.filter(Boolean).length;
        return Math.round((completedFields / requiredFields.length) * 100);
    };

    const completionPercentage = calculateCompletion();

    return (
        <Modal 
            open={modalOpen} 
            setOpen={(open) => tourStep === undefined ? setModalOpen(open) : undefined} 
            className="w-[90%] h-[95%] rounded-xl flex flex-col justify-between"
        >
            <div className="w-full h-full flex flex-col items-center overflow-hidden">
                <div className="w-full p-4 border-b bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Add New Product</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Completion:</span>
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-greenPrimary h-2 rounded-full transition-all duration-300" 
                                    style={{ width: `${completionPercentage}%` }}
                                ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-700">{completionPercentage}%</span>
                        </div>
                    </div>
                    
                    {/* Tab Navigation */}
                    <div className="flex space-x-1 border-b">
                        <TabButton tab="basic" label="Basic Info" />
                        <TabButton tab="inventory" label="Inventory & Pricing" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 w-full pb-4">
                    {/* Basic Info Tab */}
                    {activeTab === "basic" && (
                        <div className="w-full max-w-3xl space-y-6">
                            {/* Welcome Section */}
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <FaLightbulb className="text-greenPrimary mt-1 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-medium text-green-900 mb-1">Getting Started</h3>
                                        <p className="text-sm text-green-800">
                                            Start with the basic information about your product. Add a clear name, description, and images to help customers understand what you're selling.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Input 
                                ref={nameRef}
                                className="w-full" 
                                label="Product Name *" 
                                value={input.name} 
                                onChange={(e) => setInput({ ...input, name: e.target.value })} 
                                placeholder="Enter product name (e.g., Adams Dry Fly #14)"
                                disabled={isProcessing}
                                data-tour="product-name-input"
                                tooltip={{
                                    type: 'help',
                                    content: 'Choose a descriptive name that clearly identifies your product. Include key details like size, color, or pattern if relevant.'
                                }}
                                helperText="This is what customers will see in search results and product listings"
                            />
                            
                            <Textarea 
                                label="Short Description" 
                                value={input.shortDescription} 
                                onChange={(e) => setInput({ ...input, shortDescription: e.target.value })} 
                                placeholder="Brief description for product listings (e.g., Classic dry fly pattern for trout)"
                                disabled={isProcessing}
                                data-tour="product-description"
                                tooltip={{
                                    type: 'tip',
                                    content: 'Keep this concise but informative. Highlight the key benefits and use cases for your product.'
                                }}
                                helperText="Appears in product cards and search results (recommended: 50-150 characters)"
                            />
                            
                            <Textarea 
                                label="Long Description" 
                                value={input.longDescription} 
                                onChange={(e) => setInput({ ...input, longDescription: e.target.value })} 
                                placeholder="Detailed description including materials, techniques, best fishing conditions, etc."
                                disabled={isProcessing}
                                tooltip={{
                                    type: 'info',
                                    content: 'Provide comprehensive details about materials, techniques, best fishing conditions, and any special features. This helps customers make informed decisions.'
                                }}
                                helperText="Detailed information shown on the product page (recommended: 200-500 characters)"
                            />

                            <TagInput 
                                label="Tags" 
                                onChange={(newTags: string[]) => setInput({ ...input, tags: newTags })} 
                                selectedTags={input.tags || []} 
                                disabled={isProcessing}
                                data-tour="product-tags" // Add this
                                tooltip={{
                                    type: 'help',
                                    content: 'Add relevant keywords that customers might search for. Examples: dry-fly, trout, mayfly, adams, size-14, olive'
                                }}
                                helperText="Tags help customers find your product in searches"
                                placeholder="Type tags like 'dry-fly', 'trout', 'mayfly' and press Enter"
                            />
                            
                            <TagInput 
                                label="Categories" 
                                onChange={(newCategories: string[]) => setInput({ ...input, catagories: newCategories })} 
                                selectedTags={input.catagories || []} 
                                disabled={isProcessing}
                                data-tour="product-categories" // Add this
                                tooltip={{
                                    type: 'help',
                                    content: 'Select the main category your product belongs to. Examples: dry-flies, nymphs, streamers, saltwater, wet-flies'
                                }}
                                helperText="Categories help organize your products and improve discoverability"
                                placeholder="Type categories like 'dry-flies', 'nymphs' and press Enter"
                            />

                            {/* Enhanced Image Upload */}
                            <div className="space-y-3" data-tour="product-images">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-gray-700">
                                        Product Images ({input.images?.length || 0}/{MAX_FILES})
                                    </label>
                                    <FormFieldTooltip 
                                        type="help"
                                        content={
                                            <div>
                                                <p className="mb-2"><strong>Image Guidelines:</strong></p>
                                                <ul className="text-xs space-y-1">
                                                    <li>• Upload up to {MAX_FILES} high-quality images</li>
                                                    <li>• First image will be the main product photo</li>
                                                    <li>• Show different angles and details</li>
                                                    <li>• Use good lighting and clear backgrounds</li>
                                                    <li>• Max file size: 10MB per image</li>
                                                </ul>
                                            </div>
                                        }
                                        size="sm"
                                    />
                                </div>
                                
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors relative">
                                    <FaCamera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-600">
                                            <FaUpload className="inline mr-2" />
                                            Click to upload or drag and drop
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            PNG, JPG, WebP, GIF up to 10MB each
                                        </p>
                                    </div>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={(e) => handleFileSelection(e.target.files)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        disabled={isProcessing}
                                    />
                                </div>
                                
                                {/* Image Previews */}
                                {imagePreviews.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                                        {imagePreviews.map((url, idx) => (
                                            <div key={idx} className="relative group">
                                                <img 
                                                    src={url} 
                                                    alt={`Preview ${idx + 1}`} 
                                                    className="w-full h-24 object-cover rounded-lg border-2 border-gray-200 group-hover:border-blue-400 transition-colors" 
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(idx)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                                    disabled={isProcessing}
                                                    title="Remove image"
                                                >
                                                    <FaTrash className="w-3 h-3" />
                                                </button>
                                                {idx === 0 && (
                                                    <div className="absolute bottom-1 left-1 bg-greenPrimary text-white text-xs px-2 py-1 rounded">
                                                        Main
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Inventory & Pricing Tab */}
                    {activeTab === "inventory" && (
                        <div className="w-full max-w-3xl space-y-6">
                            {/* Pricing Guide */}
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <FaInfoCircle className="text-green-600 mt-1 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-medium text-green-900 mb-1">Pricing & Inventory</h3>
                                        <p className="text-sm text-green-800">
                                            Set your pricing strategy and manage inventory levels. Accurate shipping dimensions are crucial for proper shipping calculations.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input 
                                    ref={priceRef}
                                    label="Current Price *" 
                                    value={input.price} 
                                    onChange={(e) => {
                                        const newPrice = e.target.value;
                                        const discount = calculateDiscountPercentage(input.originalPrice, newPrice);
                                        setInput({ ...input, price: newPrice, discountPercentage: discount });
                                    }} 
                                    placeholder="0.00"
                                    type="number"
                                    step="0.01"
                                    disabled={isProcessing}
                                    data-tour="product-price"
                                    tooltip={{
                                        type: 'help',
                                        content: 'Set the price customers will pay. Consider your costs, market rates, and desired profit margin.'
                                    }}
                                    helperText="The final price customers will see"
                                />
                                <Input 
                                    label="Original Price (for discounts)" 
                                    value={input.originalPrice} 
                                    onChange={(e) => {
                                        const newOriginal = e.target.value;
                                        const discount = calculateDiscountPercentage(newOriginal, input.price);
                                        setInput({ ...input, originalPrice: newOriginal, discountPercentage: discount });
                                    }} 
                                    placeholder="Leave empty if no discount"
                                    type="number"
                                    step="0.01"
                                    disabled={isProcessing}
                                    tooltip={{
                                        type: 'tip',
                                        content: 'Set this if you want to show a discount. The discount percentage will be automatically calculated.'
                                    }}
                                    helperText="Optional - for showing discounts"
                                />
                            </div>

                            {/* Discount Display */}
                            {input.originalPrice && parseFloat(input.originalPrice) > parseFloat(input.price || "0") && (
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <div className="flex items-center justify-between">
                                        <span className="text-green-800 font-medium">
                                            Discount: {input.discountPercentage}% off
                                        </span>
                                        <span className="text-green-600 text-sm">
                                            Savings: ${(parseFloat(input.originalPrice) - parseFloat(input.price || "0")).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <Dropdown 
                                label="Stock Status" 
                                selected={stockStatusOptions.find(option => option.value === input.stockStatus) || stockStatusOptions[2]}
                                options={stockStatusOptions}
                                setSelected={(newSelected: string) => setInput({ ...input, stockStatus: newSelected as StockStatus })}
                                disabled={isProcessing}
                                data-tour="stock-status" // Add this
                                tooltip={{
                                    type: 'info',
                                    content: 'Indicate the current availability of your product. This helps customers know if they can purchase immediately.'
                                }}
                                helperText="Let customers know if the product is available"
                            />

                            <Checkbox 
                                label="Track Quantity" 
                                bool={input.trackQuantity} 
                                setBool={(newBool) => setInput({ ...input, trackQuantity: newBool })} 
                                disabled={isProcessing}
                                tooltip={{
                                    type: 'help',
                                    content: 'Enable this to track exact inventory levels. Useful for products with limited stock or high demand.'
                                }}
                                helperText="Automatically update stock levels when orders are placed"
                            />

                            {input.trackQuantity && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input 
                                        label="Stock Quantity" 
                                        value={input.stockQuantity} 
                                        onChange={(e) => setInput({ ...input, stockQuantity: e.target.value })} 
                                        placeholder="Available quantity"
                                        type="number"
                                        disabled={isProcessing}
                                        tooltip={{
                                            type: 'info',
                                            content: 'Enter the exact number of items you have in stock. This will be automatically updated when orders are placed.'
                                        }}
                                        helperText="Current inventory level"
                                    />
                                    <Input 
                                        label="Low Stock Alert" 
                                        value={input.lowStockThreshold} 
                                        onChange={(e) => setInput({ ...input, lowStockThreshold: e.target.value })} 
                                        placeholder="Alert when stock is low"
                                        type="number"
                                        disabled={isProcessing}
                                        tooltip={{
                                            type: 'tip',
                                            content: 'Set a threshold to receive notifications when stock gets low. This helps you reorder in time.'
                                        }}
                                        helperText="Get notified when stock falls below this number"
                                    />
                                </div>
                            )}

                            <NumberTagInput 
                                ref={quantityOptionsRef}
                                label="Quantity Options *" 
                                selectedNumbers={input.quantityOptions} 
                                onChange={(newNumbers: number[]) => setInput({ ...input, quantityOptions: newNumbers })} 
                                placeholder="Enter quantity (e.g., 1, 3, 6, 12)"
                                disabled={isProcessing}
                                data-tour="quantity-options" // Add this
                                tooltip={{
                                    type: 'help',
                                    content: 'Define the quantities customers can purchase. For example, if you sell flies in packs of 6, add 6, 12, 18, etc. This helps customers buy the right amount.'
                                }}
                                helperText="Set the quantities customers can choose from (e.g., 1, 6, 12, 24)"
                            />

                            {/* Shipping Information */}
                            <div className="space-y-4" data-tour="shipping-info"> {/* Add this */}
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-medium text-gray-700">Shipping Information *</h3>
                                    <FormFieldTooltip 
                                        type="help"
                                        content="Accurate shipping dimensions are essential for proper shipping cost calculations. Measure the package dimensions in inches and weight in pounds."
                                    />
                                </div>
                                <p className="text-xs text-gray-500">Required for accurate shipping calculations (inches and pounds)</p>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <Input 
                                        ref={shippingLengthRef}
                                        label="Length *" 
                                        value={input.shippingLength} 
                                        onChange={(e) => setInput({ ...input, shippingLength: e.target.value })} 
                                        type="number"
                                        step="0.1"
                                        placeholder="Package length"
                                        disabled={isProcessing}
                                        helperText="Length in inches"
                                    />
                                    <Input 
                                        ref={shippingWidthRef}
                                        label="Width *" 
                                        value={input.shippingWidth} 
                                        onChange={(e) => setInput({ ...input, shippingWidth: e.target.value })} 
                                        type="number"
                                        step="0.1"
                                        placeholder="Package width"
                                        disabled={isProcessing}
                                        helperText="Width in inches"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input 
                                        ref={shippingHeightRef}
                                        label="Height *" 
                                        value={input.shippingHeight} 
                                        onChange={(e) => setInput({ ...input, shippingHeight: e.target.value })} 
                                        type="number"
                                        step="0.1"
                                        placeholder="Package height"
                                        disabled={isProcessing}
                                        helperText="Height in inches"
                                    />
                                    <Input 
                                        ref={shippingWeightRef}
                                        label="Weight *" 
                                        value={input.shippingWeight} 
                                        onChange={(e) => setInput({ ...input, shippingWeight: e.target.value })} 
                                        type="number"
                                        step="0.1"
                                        placeholder="Package weight"
                                        disabled={isProcessing}
                                        helperText="Weight in pounds"
                                    />
                                </div>
                            </div>

                            {/* Save as Draft */}
                            <div className="border-t pt-4">
                                <Checkbox 
                                    label="Save as Draft" 
                                    bool={input.isDraft} 
                                    setBool={(newBool) => setInput({ ...input, isDraft: newBool })} 
                                    disabled={isProcessing}
                                    tooltip={{
                                        type: 'info',
                                        content: 'Draft products are saved but not visible to customers. Use this to work on your product listing before publishing.'
                                    }}
                                    helperText="Draft products are not visible to customers"
                                />
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="w-full border-t p-4 flex justify-between items-center bg-gray-50 relative z-10">
                    <div className="text-sm text-gray-600">
                        {isProcessing && (
                            <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                <span>
                                    {uploading ? "Uploading images..." : "Creating product..."}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3">
                        {uploading && (
                            <Button 
                                text="Cancel Upload" 
                                onClick={() => {
                                    if (uploadAbortController) {
                                        uploadAbortController.abort();
                                        toast.info("Upload cancelled.");
                                        setUploading(false);
                                        setUploadAbortController(null);
                                    }
                                }} 
                                className="bg-red-500 hover:bg-red-600" 
                                disabled={isSubmitting}
                            />
                        )}
                        <Button 
                            text="Cancel" 
                            onClick={() => setModalOpen(false)} 
                            className="bg-gray-500 hover:bg-gray-600" 
                            disabled={isProcessing}
                        />
                        <Button 
                            text={uploading ? "Uploading..." : isSubmitting ? "Creating..." : "Save Product"} 
                            onClick={handleSave} 
                            disabled={isProcessing}
                            data-tour="save-draft"
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
}